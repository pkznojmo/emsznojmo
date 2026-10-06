import { NextResponse } from 'next/server';
import { processCreditPayment } from '../notify/route';

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

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(`${GOPAY_BASE_URL}/payments/payment/${encodeURIComponent(paymentId)}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const responseText = await res.text();
    let paymentDetails: any;
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

    if (paymentDetails.state === 'PAID') {
      await processCreditPayment(paymentDetails);
    }

    return NextResponse.json(paymentDetails);
  } catch (error) {
    console.error('Chyba při ověřování GoPay platby:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Chyba při dotazu na stav platby.' },
      { status: 500 }
    );
  }
}
