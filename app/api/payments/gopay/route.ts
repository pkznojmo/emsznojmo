import { NextResponse } from 'next/server';

const GOPAY_BASE_URL = process.env.GOPAY_ENV === 'production' 
  ? 'https://gate.gopay.cz/api' 
  : 'https://gw.sandbox.gopay.com/api';

/**
 * Získání OAuth2 tokenu pro zakládání plateb
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOPAY_CLIENT_ID;
  const clientSecret = process.env.GOPAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Chybí konfigurace GOPAY_CLIENT_ID nebo GOPAY_CLIENT_SECRET.');
  }

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
      scope: 'payment-create',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OAuth chyba (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userEmail, packageId, credits, amountCZK, packageName } = body;

    if (!userId || !amountCZK || !credits) {
      return NextResponse.json({ message: 'Neúplné údaje v požadavku.' }, { status: 400 });
    }

    // 1. Získání OAuth tokenu
    const accessToken = await getAccessToken();

    // 2. Příprava dat platby (částka v haléřích)
    const amountInHalers = Math.round(amountCZK * 100);

    const paymentData = {
      payer: {
        contact: {
          email: userEmail,
        },
      },
      target: {
        type: 'ACCOUNT',
        goid: Number(process.env.GOPAY_GOID),
      },
      amount: amountInHalers,
      currency: 'CZK',
      order_number: `CREDIT-${userId.slice(0, 8)}-${Date.now()}`,
      order_description: packageName || `${credits} kreditů`,
      items: [
        {
          name: packageName || `Kreditní balíček (${credits} kreditů)`,
          amount: amountInHalers,
          count: 1,
        },
      ],
      // DŮLEŽITÉ: Předání informací pro webhook, aby věděl, komu připsat kredity
      custom_params: [
        { name: 'user_id', value: String(userId) },
        { name: 'credits', value: String(credits) },
      ],
      callback: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/kredity?status=return`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/gopay/notify`,
      },
      lang: 'CS',
    };

    // 3. Volání API pro založení platby
    const response = await fetch(`${GOPAY_BASE_URL}/payments/payment`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Chyba při vytváření platby GoPay:', data);
      return NextResponse.json(
        { message: data.errors?.[0]?.message || 'Nepodařilo se založit platbu u GoPay.' }, 
        { status: response.status }
      );
    }

    // Vrátí JSON s id a gw_url
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GoPay backend chyba:', error);
    return NextResponse.json({ message: error.message || 'Interní chyba serveru' }, { status: 500 });
  }
}