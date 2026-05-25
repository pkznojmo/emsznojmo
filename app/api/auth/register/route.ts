import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializace Supabase klienta (používá vestavěné ENV proměnné Next.js)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, birthDate, address, clothingSize, goals } = body;

    // 1. Validace povinných polí
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Vyplňte prosím všechna povinná pole.' }, { status: 400 });
    }

    // 2. REGISTRACE DO SUPABASE AUTH (Účet, heslo, ověřovací e-mail)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Chyba při vytváření účtu.' }, { status: 400 });
    }

    const authUser = authData.user;

    // 3. ZÁPIS DOBATEČNÝCH DAT ROVNOU DO SUPABASE TABULKY (Obejdení Prismy)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.id, // Propojení se Supabase Auth ID
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          birth_date: birthDate || null,
          address,
          clothing_size: clothingSize,
          goals,
          role: 'CUSTOMER',
        },
      ]);

    if (profileError) {
      console.error('Chyba při ukládání profilu do Supabase:', profileError);
      return NextResponse.json({ error: `Účet vytvořen, ale profil selhal: ${profileError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registrace úspěšná. Zkontrolujte svůj e-mail pro ověření účtu.'
    });
  } catch (error) {
    console.error('Neočekávaná chyba serveru:', error);
    return NextResponse.json({ error: 'Registrace selhala na straně serveru.' }, { status: 500 });
  }
}