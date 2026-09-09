import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json(
      { error: `Banka vrátila chybu: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'V URL chybí autorizační kód (?code=...)' },
      { status: 400 }
    );
  }

  try {
    const redirectUri = `${origin}/api/callback`;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.KB_CLIENT_ID!,
      client_secret: process.env.KB_CLIENT_SECRET!,
    });

    const res = await fetch('https://api-gateway.kb.cz/oauth2/v3/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': process.env.KB_CLIENT_SECRET!,
        'x-correlation-id': crypto.randomUUID(),
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: 'Selhala výměna kódu za token', status: res.status, detail: errText },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      message: 'Autorizace proběhla úspěšně! Ulož si tento refresh token do .env.local a na Vercel.',
      KB_REFRESH_TOKEN: data.refresh_token,
      expires_in_days: Math.round((data.expires_in || 31556926) / 86400),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}