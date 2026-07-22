import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReservationEmails } from '@/lib/emails';

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
      date,          // Formát: "YYYY-MM-DD" (např. "2026-08-15")
      time,          // Formát: "14:00" nebo "14:00 - 14:45"
      trainerName,   // Jméno trenéra pro e-mail (např. "Jan Novák" nebo "Jakýkoliv trenér")
      customerName,  // Jméno klienta pro e-mail
      customerEmail, // E-mail klienta
      trainerEmails, // Pole e-mailů trenérů: string[]
      trainerEmail,  // Zpětná kompatibilita (pokud by někdo ještě poslal jednoduše string)
      serviceName,   // Název služby (např. "EMS Trénink")
    } = body;

    // Normalizace e-mailů trenérů na pole
    let finalTrainerEmails: string[] = [];
    if (Array.isArray(trainerEmails)) {
      finalTrainerEmails = trainerEmails.filter((e): e is string => Boolean(e));
    } else if (typeof trainerEmails === 'string' && trainerEmails) {
      finalTrainerEmails = [trainerEmails];
    } else if (typeof trainerEmail === 'string' && trainerEmail) {
      finalTrainerEmails = [trainerEmail];
    }

    // 1. Validace povinných polí
    if (!user_id || !date || !time || !customerEmail || finalTrainerEmails.length === 0) {
      return NextResponse.json({ error: 'Vyplňte prosím všechna povinná pole včetně e-mailů.' }, { status: 400 });
    }

    // 2. Zápis do databáze dle tabulky `reservations`
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

    // 3. Výpočet startTime a endTime pro kalendář
    // Očekáváme time např. "14:00" nebo "14:00 - 14:45"
    const cleanTime = time.split('-')[0].trim(); // Vezme začátek ("14:00")
    const startTime = new Date(`${date}T${cleanTime}:00`);

    // Výchozí délka lekce je 45 minut (pokud není v `time` zadaný konec)
    let endTime = new Date(startTime.getTime() + 45 * 60 * 1000); 

    if (time.includes('-')) {
      const endTimeStr = time.split('-')[1].trim();
      const parsedEndTime = new Date(`${date}T${endTimeStr}:00`);
      if (!isNaN(parsedEndTime.getTime())) {
        endTime = parsedEndTime;
      }
    }

    // 4. Odeslání potvrzovacích e-mailů s tlačítky do kalendáře
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
      message: 'Rezervace úspěšně vytvořena a e-maily odeslány.',
    });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: error.message || 'Interní chyba serveru.' }, { status: 500 });
  }
}