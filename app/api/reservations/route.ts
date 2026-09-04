import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReservationEmails } from '@/lib/emails';

// Pomocná funkce pro převod času "HH:MM" na minuty
const timeToMin = (t: string): number => {
  const [h, m] = t.trim().split(':').map(Number);
  return h * 60 + m;
};

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Chybí Supabase konfigurace na serveru.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const {
      user_id,
      trainer_id,
      date,          // Formát: "YYYY-MM-DD"
      time,          // Formát: "14:00" nebo "14:00 - 14:45"
      trainerName,   // Jméno trenéra (např. "Jan Novák" nebo "Jakýkoliv trenér")
      customerName,  
      customerEmail, 
      trainerEmails, // Pole e-mailů z frontendu
      serviceName,   
    } = body;

    // 1. Validace základních polí
    if (!user_id || !date || !time || !customerEmail) {
      return NextResponse.json({ error: 'Vyplňte prosím všechna povinná pole.' }, { status: 400 });
    }

    // 2. KONTROLA A ODEČTENÍ KREDITU UŽIVATELE
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', user_id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Uživatel nenalezen.' }, { status: 400 });
    }

    if ((userProfile.credit_balance || 0) < 1) {
      return NextResponse.json({ 
        error: 'Nemáte dostatek kreditů pro vytvoření rezervace. Prosím zakupte si kredity.' 
      }, { status: 400 });
    }

    // 3. Výpočet startovního a koncového času v minutách pro kontrolu dostupnosti
    const cleanTime = time.split('-')[0].trim();
    const slotStartMin = timeToMin(cleanTime);

    let slotEndMin = slotStartMin + 45; // Výchozí délka 45 min
    if (time.includes('-')) {
      const endTimeStr = time.split('-')[1].trim();
      slotEndMin = timeToMin(endTimeStr);
    }

    // 4. URČENÍ CÍLOVÝCH E-MAILŮ TRENÉRŮ (Filtrování volných)
    let finalTrainerEmails: string[] = [];

    if (!trainer_id || trainerName === 'Jakýkoliv trenér') {
      // Bezpečné načtení dne v týdnu z datumu
      const [yr, mo, dy] = date.split('-').map(Number);
      const dayOfWeek = new Date(yr, mo - 1, dy).getDay();

      // Načteme trenéry, dostupnosti, výjimky a existující rezervace
      const [trainersRes, availRes, excRes, resRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').eq('role', 'TRAINER'),
        supabase.from('trainer_availability').select('*'),
        supabase.from('trainer_exceptions').select('*'),
        supabase.from('reservations').select('trainer_id, date, time').eq('date', date).in('status', ['CONFIRMED', 'PENDING'])
      ]);

      const allTrainers = trainersRes.data || [];
      const availabilities = availRes.data || [];
      const exceptions = excRes.data || [];
      const existingReservations = resRes.data || [];

      // Filtrujeme pouze trenéry, kteří jsou v daný slot VOLNÍ
      const availableTrainers = allTrainers.filter(t => {
        // Pravidelná dostupnost
        const hasAvailability = availabilities.some(a => 
          a.trainer_id === t.id && 
          a.day_of_week === dayOfWeek && 
          timeToMin(a.start_time) <= slotStartMin && 
          timeToMin(a.end_time) >= slotEndMin
        );

        // Výjimka - Dostupné navíc
        const hasExtra = exceptions.some(e => 
          e.trainer_id === t.id && 
          e.date === date && 
          e.type === 'AVAILABLE' && 
          timeToMin(e.start_time) <= slotStartMin && 
          timeToMin(e.end_time) >= slotEndMin
        );

        // Výjimka - Nedostupný
        const isUnavailable = exceptions.some(e => 
          e.trainer_id === t.id && 
          e.date === date && 
          e.type === 'UNAVAILABLE' && 
          timeToMin(e.start_time) < slotEndMin && 
          timeToMin(e.end_time) > slotStartMin
        );

        if ((!hasAvailability && !hasExtra) || isUnavailable) return false;

        // Kontrola překryvu s jinou rezervací trenéra
        const isBusy = existingReservations.some(r => {
          if (r.trainer_id !== t.id) return false;
          let rStartMin = 0;
          let rEndMin = 0;
          if (r.time.includes('-')) {
            const [s, e] = r.time.split('-');
            rStartMin = timeToMin(s.trim());
            rEndMin = timeToMin(e.trim());
          } else {
            rStartMin = timeToMin(r.time.trim());
            rEndMin = rStartMin + 30;
          }
          return slotStartMin < rEndMin && slotEndMin > rStartMin;
        });

        return !isBusy;
      });

      finalTrainerEmails = availableTrainers
        .map(t => t.email)
        .filter((e): e is string => Boolean(e));

      if (finalTrainerEmails.length === 0) {
        return NextResponse.json({ error: 'Pro tento čas není k dispozici žádný volný trenér.' }, { status: 400 });
      }
    } else {
      // Pokud byl vybrán konkrétní trenér
      if (Array.isArray(trainerEmails)) {
        finalTrainerEmails = trainerEmails.filter((e): e is string => Boolean(e));
      } else if (typeof trainerEmails === 'string' && trainerEmails) {
        finalTrainerEmails = [trainerEmails];
      }
    }

    if (finalTrainerEmails.length === 0) {
      return NextResponse.json({ error: 'Nenalezen žádný e-mail trenéra pro odeslání notifikace.' }, { status: 400 });
    }

    // 5. STRŽENÍ KREDITU UŽIVATELI
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credit_balance: userProfile.credit_balance - 1 })
      .eq('id', user_id);

    if (updateError) {
      return NextResponse.json({ error: 'Chyba při strhávání kreditů.' }, { status: 500 });
    }

    // Záznam do historie kreditů
    await supabase.from('credit_transactions').insert({
      user_id: user_id,
      amount: -1,
      description: `Rezervace tréninku (${date} v ${cleanTime})`,
    });

    // 6. ZÁPIS REZERVACE DO DATABÁZE
    const { data: reservation, error: dbError } = await supabase
      .from('reservations')
      .insert([
        {
          user_id: user_id,
          trainer_id: trainer_id || null,
          date: date,
          time: time,
          trainer: trainerName || 'Trenér EMS',
          status: 'CONFIRMED',
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('DB Error při rezervaci:', dbError);
      return NextResponse.json({ error: 'Chyba při ukládání rezervace do databáze.' }, { status: 500 });
    }

    // 7. VÝPOČET ČASŮ PRO KALENDÁŘ A ODESLÁNÍ E-MAILŮ
    const startTime = new Date(`${date}T${cleanTime}:00`);
    let endTime = new Date(startTime.getTime() + 45 * 60 * 1000);

    if (time.includes('-')) {
      const endTimeStr = time.split('-')[1].trim();
      const parsedEndTime = new Date(`${date}T${endTimeStr}:00`);
      if (!isNaN(parsedEndTime.getTime())) {
        endTime = parsedEndTime;
      }
    }

    await sendReservationEmails({
      customerEmail,
      customerName: customerName || 'Klient',
      trainerEmails: finalTrainerEmails,
      trainerName: trainerName || 'Trenér',
      startTime,
      endTime,
      serviceName: serviceName || 'EMS Trénink',
    });

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Rezervace úspěšně vytvořena, kredit stržen a e-maily odeslány.',
    });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: error.message || 'Interní chyba serveru.' }, { status: 500 });
  }
}