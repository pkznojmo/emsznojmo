import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReservationEmails } from '@/lib/emails'; // Použijeme existující export

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Chybí Supabase konfigurace na serveru.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { reservation_id, user_id } = body;

    // 1. Validace základních polí
    if (!reservation_id || !user_id) {
      return NextResponse.json({ error: 'Chybí ID rezervace nebo uživatele.' }, { status: 400 });
    }

    // 2. NAČTENÍ EXISTUJÍCÍ REZERVACE
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      return NextResponse.json({ error: 'Rezervace nebyla nalezena.' }, { status: 404 });
    }

    // Bezpečnostní kontrola – zrušit rezervaci může pouze její vlastník
    if (reservation.user_id !== user_id) {
      return NextResponse.json({ error: 'Nemáte oprávnění zrušit tuto rezervaci.' }, { status: 403 });
    }

    // 3. KONTROLA STORNO LHŮTY (24 Hodin předem)
    const cleanTime = reservation.time.split('-')[0].trim();
    const [yr, mo, dy] = reservation.date.split('-').map(Number);
    const [hr, mn] = cleanTime.split(':').map(Number);
    
    const reservationDate = new Date(yr, mo - 1, dy, hr, mn);
    const now = new Date();
    const hoursRemaining = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 24) {
      return NextResponse.json({ 
        error: 'Rezervaci již nelze zrušit. Storno je možné nejpozději 24 hodin před začátkem.' 
      }, { status: 400 });
    }

    // 4. NAČTENÍ PROFILU UŽIVATELE
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance, first_name, last_name, email')
      .eq('id', user_id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Uživatel nenalezen.' }, { status: 400 });
    }

    // 5. NAVRÁCENÍ KREDITU UŽIVATELI
    const currentCredits = userProfile.credit_balance || 0;
    const { error: creditUpdateError } = await supabase
      .from('profiles')
      .update({ credit_balance: currentCredits + 1 })
      .eq('id', user_id);

    if (creditUpdateError) {
      return NextResponse.json({ error: 'Chyba při přičítání kreditu.' }, { status: 500 });
    }

    // Záznam o navrácení kreditu do transakcí
    await supabase.from('credit_transactions').insert({
      user_id: user_id,
      amount: 1,
      description: `Vrácení kreditu - zrušení rezervace (${reservation.date} v ${cleanTime})`,
    });

    // 6. SMAZÁNÍ REZERVACE
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservation_id);

    if (deleteError) {
      return NextResponse.json({ error: 'Chyba při mazání rezervace.' }, { status: 500 });
    }

    // 7. ODESLÁNÍ NOTIFIKACE TRENÉROVI (využívá sendReservationEmails)
    if (reservation.trainer_id) {
      const { data: trainerProfile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', reservation.trainer_id)
        .single();

      if (trainerProfile?.email) {
        try {
          const clientName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Klient';
          const trainerName = `${trainerProfile.first_name || ''} ${trainerProfile.last_name || ''}`.trim() || 'Trenér';
          
          const startTime = new Date(`${reservation.date}T${cleanTime}:00`);
          let endTime = new Date(startTime.getTime() + 45 * 60 * 1000);

          await sendReservationEmails({
            customerEmail: userProfile.email,
            customerName: clientName,
            trainerEmails: [trainerProfile.email],
            trainerName: trainerName,
            startTime,
            endTime,
            serviceName: 'Zrušený EMS Trénink',
          });
        } catch (emailErr) {
          console.error('Chyba při odesílání storno e-mailu:', emailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rezervace byla úspěšně zrušena a kredit byl navrácen.',
    });

  } catch (error: any) {
    console.error('Server Cancel Error:', error);
    return NextResponse.json({ error: error.message || 'Interní chyba serveru.' }, { status: 500 });
  }
}