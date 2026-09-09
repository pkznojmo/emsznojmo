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

    const {
      data: reservation,
      error: reservationError,
    } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (reservationError || !reservation) {
      console.error(
        'Reservation load error:',
        reservationError
      );

      return NextResponse.json(
        {
          error: 'Rezervace nebyla nalezena.',
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 3. KONTROLA VLASTNÍKA
    // -----------------------------------------

    if (reservation.user_id !== user_id) {
      return NextResponse.json(
        {
          error:
            'Nemáte oprávnění zrušit tuto rezervaci.',
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // 4. DATUM + ČAS
    // -----------------------------------------

    const cleanTime = String(reservation.time)
      .split('-')[0]
      .trim();

    const [year, month, day] =
      String(reservation.date)
        .split('-')
        .map(Number);

    const [hour, minute] = cleanTime
      .split(':')
      .map(Number);

    const reservationDate = new Date(
      year,
      month - 1,
      day,
      hour,
      minute
    );

    const now = new Date();

    const hoursRemaining =
      (reservationDate.getTime() -
        now.getTime()) /
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

    const {
      data: userProfile,
      error: userProfileError,
    } = await supabase
      .from('profiles')
      .select(
        'credit_balance, first_name, last_name, email'
      )
      .eq('id', user_id)
      .single();

    if (userProfileError || !userProfile) {
      console.error(
        'User profile error:',
        userProfileError
      );

      return NextResponse.json(
        {
          error: 'Uživatel nenalezen.',
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 6. ZJISTÍME TRENÉRA
    // -----------------------------------------

    let trainerEmails: string[] = [];
    let trainerName = 'Trenér';

    if (reservation.trainer_id) {
      const {
        data: trainerProfile,
        error: trainerError,
      } = await supabase
        .from('profiles')
        .select(
          'email, first_name, last_name'
        )
        .eq('id', reservation.trainer_id)
        .single();

      if (trainerError) {
        console.error(
          'Trainer profile error:',
          trainerError
        );
      }

      if (trainerProfile) {
        if (trainerProfile.email) {
          trainerEmails = [
            trainerProfile.email,
          ];
        }

        trainerName =
          `${trainerProfile.first_name || ''} ${
            trainerProfile.last_name || ''
          }`.trim() || 'Trenér';
      }
    }

    console.log('STORNO EMAIL DATA:', {
      customerEmail: userProfile.email,
      trainerEmails,
      trainerName,
      reservationDate: reservation.date,
      reservationTime: cleanTime,
    });

    // -----------------------------------------
    // 7. VRÁCENÍ KREDITU
    // -----------------------------------------

    const currentCredits =
      Number(userProfile.credit_balance) || 0;

    const {
      error: creditUpdateError,
    } = await supabase
      .from('profiles')
      .update({
        credit_balance:
          currentCredits + 1,
      })
      .eq('id', user_id);

    if (creditUpdateError) {
      console.error(
        'Credit update error:',
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
    // 8. TRANSAKCE
    // -----------------------------------------

    const {
      error: transactionError,
    } = await supabase
      .from('credit_transactions')
      .insert({
        user_id,
        amount: 1,
        description:
          `Vrácení kreditu - zrušení rezervace (${reservation.date} v ${cleanTime})`,
      });

    if (transactionError) {
      console.error(
        'Transaction error:',
        transactionError
      );
    }

    // -----------------------------------------
    // 9. SMAZÁNÍ REZERVACE
    // -----------------------------------------

    const {
      error: deleteError,
    } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservation_id);

    if (deleteError) {
      console.error(
        'Delete reservation error:',
        deleteError
      );

      return NextResponse.json(
        {
          error:
            'Chyba při mazání rezervace.',
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 10. ODESLÁNÍ EMAILŮ
    // -----------------------------------------

    const clientName =
      `${userProfile.first_name || ''} ${
        userProfile.last_name || ''
      }`.trim() || 'Klient';

    const startTime = new Date(
      `${reservation.date}T${cleanTime}:00`
    );

    const endTime = new Date(
      startTime.getTime() + 45 * 60 * 1000
    );

    try {
      await sendReservationCancellationEmails({
        customerEmail:
          userProfile.email || '',
        customerName: clientName,
        trainerEmails,
        trainerName,
        startTime,
        endTime,
        serviceName:
          reservation.service_name ||
          'EMS Trénink',
      });

      console.log(
        'STORNO EMAILY ODESLÁNY'
      );
    } catch (emailError) {
      console.error(
        'STORNO EMAIL ERROR:',
        emailError
      );
    }

    // -----------------------------------------
    // 11. HOTOVO
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      message:
        'Rezervace byla zrušena a e-maily byly odeslány.',
      email: {
        customer:
          Boolean(userProfile.email),
        trainers:
          trainerEmails.length,
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