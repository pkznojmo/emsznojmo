import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GOPAY_BASE_URL = process.env.GOPAY_ENV === 'production' 
  ? 'https://gate.gopay.cz/api' 
  : 'https://gw.sandbox.gopay.com/api';

// Admin klient obcházející RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function processCreditPayment(paymentDetails: any) {
  if (paymentDetails.state !== 'PAID') return;

  const paymentId = String(paymentDetails.id);
  const params = paymentDetails.additional_params || paymentDetails.custom_params || [];
  
  const userId = params.find((p: any) => p.name === 'user_id')?.value;
  const creditsStr = params.find((p: any) => p.name === 'credits')?.value;

  if (!userId || !creditsStr) {
    console.error('Chybí user_id nebo credits v parametrech platby GoPay');
    return;
  }

  const creditsToAdd = parseInt(creditsStr, 10);
  if (isNaN(creditsToAdd) || creditsToAdd <= 0) return;

  const descriptionText = `Dobití kreditů přes GoPay (ID: ${paymentId})`;

  // 1. Idempotence: Zkontrolujeme, zda transakce s tímto ID platby už neexistuje
  const { data: existingTx } = await supabaseAdmin
    .from('credit_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('description', descriptionText)
    .maybeSingle();

  if (existingTx) {
    // Platba již byla dříve úspěšně zpracována
    return;
  }

  // 2. Načtení aktuálního profilu
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Uživatel nebyl v Supabase nalezen:', profileError);
    return;
  }

  const newBalance = (profile.credit_balance || 0) + creditsToAdd;

  // 3. Aktualizace zůstatku v profiles
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ credit_balance: newBalance })
    .eq('id', userId);

  if (updateError) {
    console.error('Chyba při aktualizaci zůstatku kreditů:', updateError);
    return;
  }

  // 4. Záznam do kreditních transakcí
  await supabaseAdmin
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: creditsToAdd,
      type: 'CHARGE',
      description: descriptionText,
    });
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

    if (paymentDetails.state === 'PAID') {
      await processCreditPayment(paymentDetails);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Chyba při zpracování GoPay notifikace:', error);
    return NextResponse.json({ message: 'Chyba serveru' }, { status: 500 });
  }
}