import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/clothing-store';
import { Resend } from 'resend';
import { escapeEmailHtml } from '@/lib/clothing-store';

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
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CLOTHING_PRICE_CZK = 990;

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
    const productType = body.productType === 'ems_clothing' ? 'ems_clothing' : 'credits';
    if (productType === 'ems_clothing') {
      const size = String(body.size || '').toUpperCase();
      if (!CLOTHING_SIZES.includes(size)) return NextResponse.json({ message: 'Vyberte platnou velikost oblečení.' }, { status: 400 });
      const db = getSupabaseAdmin();
      const [{ data: profile, error: profileError }, { data: inventory, error: inventoryError }] = await Promise.all([
        db.from('profiles').select('first_name, last_name, email').eq('id', authData.user.id).single(),
        db.from('ems_clothing_inventory').select('stock').eq('size', size).single(),
      ]);
      if (profileError || !profile) return NextResponse.json({ message: 'Nepodařilo se ověřit uživatelský účet.' }, { status: 400 });
      if (inventoryError) throw inventoryError;
      if (inventory.stock < 1) return NextResponse.json({ message: `Velikost ${size} je momentálně vyprodaná.` }, { status: 409 });
      const userEmail = profile.email || authData.user.email;
      if (!userEmail) return NextResponse.json({ message: 'U účtu chybí e-mailová adresa.' }, { status: 400 });
      const { data: stockReservation, error: stockError } = await db.rpc('reserve_ems_clothing_stock', { target_size: size, amount_to_reserve: 1 });
      if (stockError) throw stockError;
      if (!stockReservation?.length) return NextResponse.json({ message: `Velikost ${size} už mezitím někdo objednal. Obnovte stránku.` }, { status: 409 });
      const customerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Klient';
      const { data: order, error: orderError } = await db.from('ems_clothing_orders').insert({
        user_id: authData.user.id, customer_name: customerName, customer_email: userEmail,
        size, quantity: 1, unit_price: CLOTHING_PRICE_CZK, status: 'PENDING_PAYMENT',
      }).select('id').single();
      if (orderError) {
        await db.rpc('release_ems_clothing_stock', { target_size: size, amount_to_release: 1 });
        throw orderError;
      }
      const selected = { credits: 0, amountCZK: CLOTHING_PRICE_CZK, name: `EMS oblečení – velikost ${size}` };
      let payment: GoPayCreateResponse;
      try {
        payment = await createGoPayPayment({ userId: authData.user.id, email: userEmail, selected, orderType: 'ems_clothing', orderId: order.id, size });
      } catch (error) {
        await db.from('ems_clothing_orders').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('id', order.id);
        await db.rpc('release_ems_clothing_stock', { target_size: size, amount_to_release: 1 });
        throw error;
      }
      const { error: updateError } = await db.from('ems_clothing_orders').update({ gopay_payment_id: String(payment.id) }).eq('id', order.id);
      if (updateError) {
        await db.from('ems_clothing_orders').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('id', order.id);
        await db.rpc('release_ems_clothing_stock', { target_size: size, amount_to_release: 1 });
        throw updateError;
      }

      const adminEmails = Array.from(new Set((process.env.EMS_STORE_ADMIN_EMAILS || '').split(',').map((email) => email.trim())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))));
      if (adminEmails.length && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const result = await resend.emails.send({
          from: 'EMS Znojmo <registrace@emsznojmo.cz>',
          to: adminEmails,
          subject: 'Nová objednávka EMS oblečení – čeká na platbu',
          html: `<p>Byla vytvořena nová objednávka EMS oblečení a čeká na platbu přes GoPay.</p><p>Klient: <strong>${escapeEmailHtml(customerName)}</strong><br>E-mail: ${escapeEmailHtml(userEmail)}<br>Velikost: ${size}<br>Částka: ${CLOTHING_PRICE_CZK.toLocaleString('cs-CZ')} Kč<br>Objednávka: ${escapeEmailHtml(order.id)}</p>`,
        });
        if (result.error) console.error('Oznámení adminům o nové objednávce nešlo odeslat:', result.error);
      } else {
        console.error('Oznámení adminům o objednávce neodesláno: chybí EMS_STORE_ADMIN_EMAILS nebo RESEND_API_KEY.', { orderId: order.id });
      }
      return NextResponse.json(payment);
    }

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

    const payment = await createGoPayPayment({ userId: authData.user.id, email: authData.user.email || undefined, selected, orderType: 'credits' });
    return NextResponse.json(payment);
  } catch (error: unknown) {
    console.error('GoPay backend chyba:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Interní chyba serveru' }, { status: 500 });
  }
}

async function createGoPayPayment({ userId, email, selected, orderType, orderId, size }: {
  userId: string;
  email?: string;
  selected: { credits: number; amountCZK: number; name: string };
  orderType: 'credits' | 'ems_clothing';
  orderId?: string;
  size?: string;
}) {
    const goid = Number(process.env.GOPAY_GOID);
    if (!goid || isNaN(goid)) {
      throw new Error('Chybí nebo je neplatné GOPAY_GOID v nastavení serveru.');
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
      order_number: `${orderType === 'credits' ? 'CREDIT' : 'CLOTH'}-${userId.slice(0, 8)}-${Date.now()}`,
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
        { name: 'user_id', value: userId },
        { name: 'order_type', value: orderType },
        ...(orderType === 'credits' ? [{ name: 'credits', value: String(selected.credits) }] : []),
        ...(orderId ? [{ name: 'order_id', value: orderId }] : []),
        ...(size ? [{ name: 'size', value: size }] : []),
      ],
      callback: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kredity?status=return&product=${orderType}${orderId ? `&order=${encodeURIComponent(orderId)}` : ''}`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/gopay/notify`,
      },
      lang: 'CS',
    };

    // Pokud uživatel má validní e-mail, předáme jej do GoPay
    if (email && email.includes('@')) {
      paymentData.payer = {
        contact: {
          email,
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
      throw new Error(data.errors?.[0]?.message || `Nepodařilo se založit platbu u GoPay (${response.status}).`);
    }

    if (!data.id || !data.gw_url) {
      throw new Error('GoPay nevytvořil platbu nebo nevrátil adresu platební brány.');
    }

    // Vrátí JSON s id a gw_url
    return data;
}
