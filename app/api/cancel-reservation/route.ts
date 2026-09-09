import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReservationCancellationEmails } from '@/lib/emails';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          error: 'Chybí Supabase konfigurace na serveru.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    const body = await request.json();

    const { reservation_id, user_id } = body;

    // -----------------------------------------
    // 1. VALIDACE
    // -----------------------------------------

    if (!reservation_id || !user_id) {
      return NextResponse.json(
        {
          error: 'Chybí ID rezervace nebo uživatele.',
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 2. NAČTENÍ REZERVACE
    // -----------------------------------------

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      return NextResponse.json(
        {
          error: 'Rezervace nebyla nalezena.',
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 3. BEZPEČNOSTNÍ KONTROLA
    // -----------------------------------------

    if (reservation.user_id !== user_id) {
      return NextResponse.json(
        {
          error: 'Nemáte oprávnění zrušit tuto rezervaci.',
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // 4. STORNO LHŮTA 24 HODIN
    // -----------------------------------------

    const cleanTime = reservation.time
      .split('-')[0]
      .trim();

    const [yr, mo, dy] = reservation.date
      .split('-')
      .map(Number);

    const [hr, mn] = cleanTime
      .split(':')
      .map(Number);

    const reservationDate = new Date(
      yr,
      mo - 1,
      dy,
      hr,
      mn
    );

    const now = new Date();

    const hoursRemaining =
      (reservationDate.getTime() - now.getTime()) /
      (1000 * 60 * 60);

    if (hoursRemaining < 24) {
      return NextResponse.json(
        {
          error:
            'Rezervaci již nelze zrušit. Storno je možné nejpozději 24 hodin před začátkem.',
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 5. PROFIL UŽIVATELE
    // -----------------------------------------

    const { data: userProfile, error: profileError } =
      await supabase
        .from('profiles')
        .select(
          'credit_balance, first_name, last_name, email'
        )
        .eq('id', user_id)
        .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        {
          error: 'Uživatel nenalezen.',
        },
        { status: 400 }
      );
    }

    if (!userProfile.email) {
      return NextResponse.json(
        {
          error:
            'Uživatel nemá nastavený e-mail.',
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 6. NAČTENÍ TRENÉRŮ
    //
    // Podporuje:
    // - reservation.trainer_id
    // - reservation.trainer_ids[]
    // -----------------------------------------

    const trainerIds = Array.from(
      new Set(
        [
          reservation.trainer_id,
          ...(Array.isArray(reservation.trainer_ids)
            ? reservation.trainer_ids
            : []),
        ].filter(Boolean)
      )
    );

    let trainerProfiles: Array<{
      id: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    }> = [];

    if (trainerIds.length > 0) {
      const {
        data: trainers,
        error: trainersError,
      } = await supabase
        .from('profiles')
        .select(
          'id, email, first_name, last_name'
        )
        .in('id', trainerIds);

      if (trainersError) {
        console.error(
          'Chyba při načítání trenérů:',
          trainersError
        );
      } else if (trainers) {
        trainerProfiles = trainers;
      }
    }

    // E-mailové adresy trenérů
    const trainerEmails = trainerProfiles
      .map((trainer) => trainer.email)
      .filter(
        (email): email is string =>
          Boolean(email)
      );

    const trainerNames = trainerProfiles
      .map((trainer) =>
        `${trainer.first_name || ''} ${
          trainer.last_name || ''
        }`.trim()
      )
      .filter(Boolean);

    const trainerName =
      trainerNames.length > 0
        ? trainerNames.join(', ')
        : 'Trenér';

    // -----------------------------------------
    // 7. VRÁCENÍ KREDITU
    // -----------------------------------------

    const currentCredits =
      userProfile.credit_balance || 0;

    const { error: creditUpdateError } =
      await supabase
        .from('profiles')
        .update({
          credit_balance: currentCredits + 1,
        })
        .eq('id', user_id);

    if (creditUpdateError) {
      console.error(
        'Chyba při přičítání kreditu:',
        creditUpdateError
      );

      return NextResponse.json(
        {
          error:
            'Chyba při přičítání kreditu.',
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 8. ZÁZNAM O VRÁCENÍ KREDITU
    // -----------------------------------------

    const { error: transactionError } =
      await supabase
        .from('credit_transactions')
        .insert({
          user_id,
          amount: 1,
          description: `Vrácení kreditu - zrušení rezervace (${reservation.date} v ${cleanTime})`,
        });

    if (transactionError) {
      console.error(
        'Chyba při ukládání kreditní transakce:',
        transactionError
      );
    }

    // -----------------------------------------
    // 9. SMAZÁNÍ REZERVACE
    // -----------------------------------------

    const { error: deleteError } =
      await supabase
        .from('reservations')
        .delete()
        .eq('id', reservation_id);

    if (deleteError) {
      return NextResponse.json(
        {
          error:
            'Chyba při mazání rezervace.',
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 10. ODESLÁNÍ STORNO E-MAILŮ
    // -----------------------------------------

    try {
      const clientName =
        `${userProfile.first_name || ''} ${
          userProfile.last_name || ''
        }`.trim() || 'Klient';

      const startTime = new Date(
        `${reservation.date}T${cleanTime}:00`
      );

      const endTime = new Date(
        startTime.getTime() +
          45 * 60 * 1000
      );

      await sendReservationCancellationEmails({
        customerEmail: userProfile.email,
        customerName: clientName,
        trainerEmails,
        trainerName,
        startTime,
        endTime,
        serviceName: 'EMS Trénink',
      });

      console.log(
        'Storno e-maily úspěšně odeslány.',
        {
          customerEmail: userProfile.email,
          trainerEmails,
        }
      );
    } catch (emailError) {
      // Rezervace je zrušená i v případě,
      // že Resend vrátí chybu.
      console.error(
        'Chyba při odesílání storno e-mailů:',
        emailError
      );
    }

    // -----------------------------------------
    // 11. ODPOVĚĎ
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      message:
        'Rezervace byla úspěšně zrušena, kredit byl navrácen a storno e-maily byly zpracovány.',
      emails: {
        customer: Boolean(userProfile.email),
        trainers: trainerEmails.length,
      },
    });
  } catch (error: any) {
    console.error(
      'Server Cancel Error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Interní chyba serveru.',
      },
      { status: 500 }
    );
  }
}