import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const VIP_ROLES = ['VIP', 'TRAINER', 'ADMIN', 'VIP_TRAINER', 'SWIMMER'];
const PACKAGES = {
  customer: {
    single: { credits: 1, amountCZK: 790, name: '1 lekce' },
    'pack-10': { credits: 10, amountCZK: 6990, name: '10 lekcí' },
    'pack-20': { credits: 20, amountCZK: 12800, name: '20 lekcí' },
  },
  vip: {
    single: { credits: 1, amountCZK: 500, name: '1 lekce' },
  },
} as const;

interface GoPayCreateResponse {
  id?: string | number;
  gw_url?: string;
  errors?: { message?: string }[];
  [key: string]: unknown;
}

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
    throw new Error('Chybí konfigurace GOPAY_CLIENT_ID nebo GOPAY_CLIENT_SECRET v .env');
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
    const authorization = req.headers.get('authorization');
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearerToken) {
      return NextResponse.json({ message: 'Pro založení platby se přihlaste.' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(bearerToken);
    if (authError || !authData.user) {
      return NextResponse.json({ message: 'Přihlášení vypršelo. Znovu se přihlaste.' }, { status: 401 });
    }

    const body = await req.json();
    const packageId = body.packageId;
    if (typeof packageId !== 'string') {
      return NextResponse.json({ message: 'Vybraný balíček není platný.' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'Nepodařilo se ověřit uživatelský účet.' }, { status: 400 });
    }

    const packageSet = VIP_ROLES.includes(String(profile.role).toUpperCase()) ? PACKAGES.vip : PACKAGES.customer;
    const selected = Object.prototype.hasOwnProperty.call(packageSet, packageId)
      ? packageSet[packageId as keyof typeof packageSet]
      : null;
    if (!selected) return NextResponse.json({ message: 'Vybraný balíček není platný.' }, { status: 400 });

    const goid = Number(process.env.GOPAY_GOID);
    if (!goid || isNaN(goid)) {
      return NextResponse.json(
        { message: 'Chybí nebo je neplatné GOPAY_GOID v nastavení serveru.' }, 
        { status: 500 }
      );
    }

    // 1. Získání OAuth tokenu
    const accessToken = await getAccessToken();

    // 2. Příprava dat platby (částka v haléřích)
    const amountInHalers = selected.amountCZK * 100;

    const paymentData: Record<string, unknown> = {
      target: {
        type: 'ACCOUNT',
        goid: goid,
      },
      amount: amountInHalers,
      currency: 'CZK',
      order_number: `CREDIT-${authData.user.id.slice(0, 8)}-${Date.now()}`,
      order_description: selected.name,
      items: [
        {
          name: selected.name,
          amount: amountInHalers,
          count: 1,
        },
      ],
      // Správný název pole pro parametry v GoPay API
      additional_params: [
        { name: 'user_id', value: authData.user.id },
        { name: 'credits', value: String(selected.credits) },
      ],
      callback: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kredity?status=return`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/gopay/notify`,
      },
      lang: 'CS',
    };

    // Pokud uživatel má validní e-mail, předáme jej do GoPay
    if (authData.user.email && authData.user.email.includes('@')) {
      paymentData.payer = {
        contact: {
          email: authData.user.email,
        },
      };
    }

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

    const responseText = await response.text();
    let data: GoPayCreateResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`GoPay vrátil neplatnou odpověď (${response.status}).`);
    }

    if (!response.ok) {
      console.error('Chyba při vytváření platby GoPay:', data);
      return NextResponse.json(
        { message: data.errors?.[0]?.message || 'Nepodařilo se založit platbu u GoPay.' }, 
        { status: response.status }
      );
    }

    if (!data.id || !data.gw_url) {
      throw new Error('GoPay nevytvořil platbu nebo nevrátil adresu platební brány.');
    }

    // Vrátí JSON s id a gw_url
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('GoPay backend chyba:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Interní chyba serveru' }, { status: 500 });
  }
}
