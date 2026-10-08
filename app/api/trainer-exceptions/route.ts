import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Chybí Supabase konfigurace na serveru.' }, { status: 500 });
  }

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({ error: 'Pro načtení výjimek se přihlaste.' }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: 'Přihlášení vypršelo. Obnovte stránku.' }, { status: 401 });
  }

  const date = new URL(request.url).searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Datum není platné.' }, { status: 400 });
  }

  const dataClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await dataClient
    .from('trainer_exceptions')
    .select('id, trainer_id, date, start_time, end_time, type')
    .eq('date', date);

  if (error) {
    console.error('Nepodařilo se načíst výjimky trenérů:', error.message);
    return NextResponse.json({ error: 'Nepodařilo se načíst výjimky trenérů.' }, { status: 500 });
  }

  return NextResponse.json({ exceptions: data ?? [] }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
