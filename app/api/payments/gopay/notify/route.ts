import { NextResponse } from 'next/server';
import { processCreditPayment, type GoPayPaymentDetails } from '@/lib/gopay-credit';
import { isClothingPayment, processClothingPayment, type GoPayClothingPaymentDetails } from '@/lib/gopay-clothing';
import { getSupabaseAdmin } from '@/lib/clothing-store';

const GOPAY_BASE_URL = process.env.GOPAY_ENV === 'production' 
  ? 'https://gate.gopay.cz/api' 
  : 'https://gw.sandbox.gopay.com/api';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOPAY_CLIENT_ID;
  const clientSecret = process.env.GOPAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Chybí konfigurace GoPay OAuth.');

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${GOPAY_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'payment-all',
    }),
  });
  if (!res.ok) {
    throw new Error(`GoPay OAuth selhal (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error('GoPay OAuth nevrátil přístupový token.');
  return data.access_token;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('id');

  if (!paymentId) {
    return NextResponse.json({ message: 'Chybí ID platby' }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();

    const res = await fetch(`${GOPAY_BASE_URL}/payments/payment/${encodeURIComponent(paymentId)}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const responseText = await res.text();
    let paymentDetails: GoPayPaymentDetails & { message?: string; errors?: { message?: string }[] };
    try {
      paymentDetails = JSON.parse(responseText);
    } catch {
      throw new Error(`GoPay vrátil neplatnou odpověď (${res.status}).`);
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: paymentDetails?.message || paymentDetails?.errors?.[0]?.message || `GoPay odmítl notifikaci (${res.status}).` },
        { status: res.status }
      );
    }
    if (!paymentDetails?.state) throw new Error('GoPay odpověď neobsahuje stav platby.');

    const clothingPayment = await isClothingPayment(paymentDetails as GoPayClothingPaymentDetails);
    if (paymentDetails.state === 'PAID') {
      if (clothingPayment) await processClothingPayment(paymentDetails as GoPayClothingPaymentDetails);
      else await processCreditPayment(paymentDetails);
    } else if (clothingPayment && ['CANCELED', 'TIMEOUTED', 'FAILED'].includes(paymentDetails.state)) {
      const params = paymentDetails.additional_params || paymentDetails.custom_params || [];
      const orderId = params.find((param) => param.name === 'order_id')?.value;
      if (orderId) {
        const db = getSupabaseAdmin();
        const { data: cancelledOrder } = await db.from('ems_clothing_orders').update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
          .eq('id', orderId).eq('status', 'PENDING_PAYMENT').select('size, quantity').maybeSingle();
        if (cancelledOrder) await db.rpc('release_ems_clothing_stock', { target_size: cancelledOrder.size, amount_to_release: cancelledOrder.quantity });
      }
    }

    return NextResponse.json({ status: 'ok', state: paymentDetails.state });
  } catch (error) {
    console.error('Chyba při zpracování GoPay notifikace:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Chyba serveru při zpracování GoPay notifikace.' },
      { status: 500 }
    );
  }
}
