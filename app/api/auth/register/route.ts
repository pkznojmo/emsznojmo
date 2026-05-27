import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Použijeme SERVICE_ROLE_KEY pro zápis do DB bez omezení RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Ujisti se, že ho máš v .env
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, password, firstName, lastName, phone, 
      birthDate, address, clothingSize, goals, customer_note 
    } = body;

    // 1. Validace povinných polí
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Vyplňte prosím všechna povinná pole.' }, { status: 400 });
    }

    // 2. Kontrola, zda e-mail už neexistuje v profiles
    // (Předchází chybě 23503, o které jsme mluvili)
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Uživatel s tímto e-mailem již existuje.' }, { status: 400 });
    }

    // 3. Registrace do Supabase Auth
    // Data ukládáme i do metadata – je to záloha a profi standard
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          phone,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Nepodařilo se vytvořit uživatele.' }, { status: 400 });
    }

    // 4. Zápis do tabulky profiles
    // Používáme data přímo z authData.user.id pro absolutní jistotu
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          birth_date: birthDate || null,
          address: address || null,
          clothing_size: clothingSize || 'M',
          goals: goals || null,
          customer_note: customer_note || null,
          role: 'CUSTOMER',
        },
      ]);

    if (profileError) {
      // Pokud profil selže, můžeme teoreticky uživatele z Auth smazat, 
      // aby se mohl zkusit registrovat znovu se stejným mailem
      console.error('DB Profile Error:', profileError);
      return NextResponse.json({ 
        error: 'Chyba při ukládání dat profilu. Zkuste to prosím znovu.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registrace proběhla úspěšně. Zkontrolujte svůj e-mail.' 
    });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Interní chyba serveru.' }, { status: 500 });
  }
}