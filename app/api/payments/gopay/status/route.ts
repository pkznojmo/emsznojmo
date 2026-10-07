import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processCreditPayment, type GoPayPaymentDetails } from '@/lib/gopay-credit';
import { isClothingPayment, processClothingPayment, type GoPayClothingPaymentDetails } from '@/lib/gopay-clothing';
import { getSupabaseAdmin } from '@/lib/clothing-store';

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GOPAY_BASE_URL = process.env.GOPAY_ENV === 'production' 
  ? 'https://gate.gopay.cz/api' 
  : 'https://gw.sandbox.gopay.com/api';

async function getAccessToken(): Promise<string> {
  const authHeader = Buffer.from(`${process.env.GOPAY_CLIENT_ID}:${process.env.GOPAY_CLIENT_SECRET}`).toString('base64');
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
    const details = await res.text();
    throw new Error(`GoPay OAuth selhal (${res.status}): ${details}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('GoPay OAuth nevrátil přístupový token.');
  }
  return data.access_token;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('id');

  if (!paymentId) {
    return NextResponse.json({ message: 'Chybí ID platby' }, { status: 400 });
  }

  const bearerToken = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearerToken) {
    return NextResponse.json({ message: 'Pro ověření platby se přihlaste.' }, { status: 401 });
  }

  const { data: authData, error: authError } = await supabaseAnon.auth.getUser(bearerToken);
  if (authError || !authData.user) {
    return NextResponse.json({ message: 'Přihlášení vypršelo. Znovu se přihlaste.' }, { status: 401 });
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
        { message: paymentDetails?.message || paymentDetails?.errors?.[0]?.message || `GoPay odmítl dotaz na platbu (${res.status}).` },
        { status: res.status }
      );
    }
    if (!paymentDetails?.state) {
      throw new Error('GoPay odpověď neobsahuje stav platby.');
    }

    const params = paymentDetails.additional_params || paymentDetails.custom_params;
    const paymentUserId = Array.isArray(params)
      ? params.find((param) => param.name === 'user_id')?.value
      : undefined;
    if (paymentUserId !== authData.user.id) {
      return NextResponse.json({ message: 'Platba nebyla nalezena.' }, { status: 404 });
    }

    const clothingPayment = await isClothingPayment(paymentDetails as GoPayClothingPaymentDetails);
    if (paymentDetails.state === 'PAID') {
      if (clothingPayment) await processClothingPayment(paymentDetails as GoPayClothingPaymentDetails);
      else await processCreditPayment(paymentDetails);
    } else if (clothingPayment && ['CANCELED', 'TIMEOUTED', 'FAILED'].includes(paymentDetails.state)) {
      const params = paymentDetails.additional_params || paymentDetails.custom_params || [];
      const orderId = params.find((param) => param.name === 'order_id')?.value;
      if (orderId) {
        const adminDb = getSupabaseAdmin();
        const { data: cancelledOrder } = await adminDb.from('ems_clothing_orders').update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
          .eq('id', orderId).eq('user_id', authData.user.id).eq('status', 'PENDING_PAYMENT').select('size, quantity').maybeSingle();
        if (cancelledOrder) await adminDb.rpc('release_ems_clothing_stock', { target_size: cancelledOrder.size, amount_to_release: cancelledOrder.quantity });
      }
    }

    return NextResponse.json({ state: paymentDetails.state, productType: clothingPayment ? 'ems_clothing' : 'credits' });
  } catch (error) {
    console.error('Chyba při ověřování GoPay platby:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Chyba při dotazu na stav platby.' },
      { status: 500 }
    );
  }
}
