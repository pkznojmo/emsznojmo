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
  const data = await res.json();
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
    const res = await fetch(`${GOPAY_BASE_URL}/payments/payment/${paymentId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const paymentDetails = await res.json();

    // Pokud je zaplaceno, provede se připsání v DB (díky kontrole se nezapíše dvakrát)
    if (paymentDetails.state === 'PAID') {
      await processCreditPayment(paymentDetails);
    }

    return NextResponse.json(paymentDetails);
  } catch (error) {
    return NextResponse.json({ message: 'Chyba při dotazu na stav platby' }, { status: 500 });
  }
}