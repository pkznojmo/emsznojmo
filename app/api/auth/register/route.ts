import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Chybí Supabase konfigurace v proměnných prostředí!");
      return NextResponse.json(
        { error: 'Chybí konfigurace SUPABASE_SERVICE_ROLE_KEY v .env.local' }, 
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { 
      email, password, firstName, lastName, phone, 
      birthDate, address, clothingSize, goals, customer_note 
    } = body;

    // 1. Validace povinných polí
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Vyplňte prosím všechna povinná pole.' }, { status: 400 });
    }

    // 2. Bezpečná kontrola existence e-mailu přes maybeSingle()
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error('Chyba při kontrole e-mailu:', checkError.message);
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Uživatel s tímto e-mailem již existuje.' }, { status: 400 });
    }

    // Získání domény z požadavku (funguje pro localhost i produkční https://www.emsznojmo.cz)
    const requestOrigin = request.headers.get('origin') || 'https://www.emsznojmo.cz';

    // 3. Registrace do Supabase Auth s nastavením přesměrovací URL
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${requestOrigin}/auth/callback`, // <-- DŮLEŽITÉ PRO SPRÁVNÉ OVĚŘENÍ
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Nepodařilo se vytvořit uživatele.' }, { status: 400 });
    }

    // Ošetření prázdného data narození
    const formattedBirthDate = birthDate && birthDate.trim() !== '' ? birthDate : null;

    // 4. Zápis/Aktualizace v tabulce profiles pomocí UPSERT
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          id: authData.user.id,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          birth_date: formattedBirthDate,
          address: address || null,
          clothing_size: clothingSize || 'M',
          goals: goals || null,
          customer_note: customer_note || null,
          role: 'CLIENT',
        },
      ], { onConflict: 'id' });

    if (profileError) {
      console.error('DB Profile Error:', profileError);
      return NextResponse.json({ 
        error: `Chyba profilu: ${profileError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registrace proběhla úspěšně. Zkontrolujte svůj e-mail.' 
    });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Interní chyba serveru.' 
    }, { status: 500 });
  }
}