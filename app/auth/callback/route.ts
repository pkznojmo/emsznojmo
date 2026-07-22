import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Parametr 'next' nám říká, kam přesměrovat (např. /obnova-hesla)
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Chybí Supabase konfigurace v proměnných prostředí!');
      return NextResponse.redirect(`${origin}/prihlaseni?error=Chyba%20konfigurace`);
    }

    const cookieStore = await cookies();

    // Vytvoříme klientskou instanci s přístupem ke cookies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorujeme, pokud je voláno ze Server Component
          }
        },
      },
    });

    // Výměna jednorázového kódu z e-mailu za platné přihlašovací cookies (session)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Úspěch -> přesměrujeme na /obnova-hesla (nebo kamkoliv z parametru next)
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Chyba při výměně kódu za session:', error.message);
    }
  }

  // Pokud kód chybí nebo nastala chyba, pošleme ho zpět na přihlášení
  return NextResponse.redirect(`${origin}/prihlaseni?error=Chyba%20overeni`);
}