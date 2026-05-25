'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { Users, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const DAYS_NAMES: { [key: number]: string } = {
  1: 'Pondělí', 2: 'Úterý', 3: 'Středa', 4: 'Čtvrtek', 5: 'Pátek', 6: 'Sobota', 0: 'Neděle'
};

const GENERATED_SLOTS = (() => {
  const slots = [];
  for (let hour = 6; hour <= 18; hour++) {
    const hStr = hour.toString().padStart(2, '0');
    slots.push(`${hStr}:00`);
    slots.push(`${hStr}:30`);
  }
  return slots;
})();

const getNextSevenDays = () => {
  const days = [];
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'numeric' };
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      isoString: d.toISOString().split('T')[0],
      formatted: d.toLocaleDateString('cs-CZ', options),
      dayOfWeek: d.getDay(),
      isToday: i === 0
    });
  }
  return days;
};

export default function ClientBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data z DB
  const [bookings, setBookings] = useState<any[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);

  const upcomingSevenDays = useMemo(() => getNextSevenDays(), []);

  const fetchData = async (trainerFullName: string) => {
    // Získání dnešního datumu bezpečně podle lokálního času (ne UTC)
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localISODate = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];

    // 1. Načtení rezervací pro 7denní osu (Funguje ti správně)
    const { data: bks } = await supabase
      .from('reservations')
      .select('id, date, time, user_id, status')
      .eq('trainer', trainerFullName)
      .eq('status', 'CONFIRMED')
      .gte('date', upcomingSevenDays[0].isoString)
      .lte('date', upcomingSevenDays[6].isoString);

    // 2. ✅ UPRAVENO: Zjednodušené načítání 10 nejbližších tréninků
    // Nejdřív vytáhneme čisté rezervace od dnešního dne dál
    const { data: upcoming, error: upcomingError } = await supabase
      .from('reservations')
      .select('id, date, time, user_id, status')
      .eq('trainer', trainerFullName)
      .eq('status', 'CONFIRMED')
      .gte('date', localISODate) // Použijeme bezpečné lokální datum
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(10);

    if (upcomingError) {
      console.error("Chyba při načítání rezervací:", upcomingError);
    }

    // Pokud máme rezervace, dotáhneme k nim profily ručně a spolehlivě bez složitých JOINů v jednom selectu
    if (upcoming && upcoming.length > 0) {
      const userIds = upcoming.map(r => r.user_id);
      
      // Načteme profily pro všechny uživatele, co mají trénink
      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, age, completed_trainings')
        .in('id', userIds);

      // Spojíme data dohromady do jednoho objektu
      const enrichedTrainings = upcoming.map(res => {
        const profile = clientProfiles?.find(p => p.id === res.user_id);
        return {
          ...res,
          profiles: profile || { full_name: 'Neznámý klient', age: null, completed_trainings: 0 }
        };
      });

      setUpcomingTrainings(enrichedTrainings);
    } else {
      setUpcomingTrainings([]);
    }

    if (bks) setBookings(bks);
    setLoading(false);
  };

  useEffect(() => {
    const checkTrainer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/prihlaseni');
        return;
      }
      
      // Zjistíme roli a zároveň celé jméno trenéra pro filtrování
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'TRAINER') {
        router.push('/dashboard');
        return;
      }

      const trainerFullName = `${profile.first_name} ${profile.last_name}`;
      fetchData(trainerFullName);
    };
    checkTrainer();
  }, [router]);

  // Výpočet matice - propojujeme na správné sloupce (time namísto start_time)
  const calculatedDaysMatrix = useMemo(() => {
    return upcomingSevenDays.map(day => {
      const slots = GENERATED_SLOTS.map(slot => {
        // ✅ UPRAVENO: hledáme shodu v 'time'
        const hasBooking = bookings.find(b => b.date === day.isoString && b.time === slot);

        if (hasBooking) {
          return {
            time: slot,
            status: 'BOOKED',
            // Jméno vytáhneme z propojeného profilu, pokud ho v matici nepotřebuješ hned textově, dáme placeholder
            client: 'Klient rezervován', 
            training: 'EMS Trénink'
          };
        }

        return {
          time: slot,
          status: 'OFF'
        };
      });

      return { ...day, slots };
    });
  }, [upcomingSevenDays, bookings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl space-y-8 overflow-x-hidden">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Přehled rezervací a klientů 👥</h1>
          <p className="text-gray-500 mt-1">
            Čisté zobrazení obsazenosti rozvrhu a detailní přehled nejbližších tréninků.
          </p>
        </header>

        {/* 1. BLOK: ČASOVÁ OSA */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={20} className="text-purple-600" /> Obsazenost v tomto týdnu
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <span className="w-3.5 h-3.5 rounded bg-purple-600" /> Trénink s klientem
            </div>
          </div>

          <div className="overflow-x-auto min-w-full pt-2">
            <div className="inline-block min-w-[950px] w-full">
              
              {/* Hodiny */}
              <div className="flex items-center mb-1 text-[10px] font-bold text-gray-400 text-center">
                <div className="w-36 shrink-0 text-left pl-2">Datum a den</div>
                <div className="flex-1 flex">
                  {GENERATED_SLOTS.map((slot, idx) => (
                    <div key={slot} className="flex-1 text-[10px]">
                      {idx % 2 === 0 ? slot.split(':')[0] : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7 Řádků */}
              <div className="space-y-2">
                {calculatedDaysMatrix.map(day => (
                  <div key={day.isoString} className="flex items-center group">
                    
                    {/* Datum */}
                    <div className="w-36 shrink-0 text-sm flex flex-col justify-center leading-tight">
                      <span className="font-extrabold text-gray-800">{day.formatted}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {day.isToday ? 'Dnes' : DAYS_NAMES[day.dayOfWeek]}
                      </span>
                    </div>

                    {/* Osa */}
                    <div className="flex-1 flex h-10 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                      {day.slots.map((slot, idx) => {
                        const isBooked = slot.status === 'BOOKED';
                        return (
                          <div
                            key={idx}
                            className={`flex-1 border-r border-gray-200/30 last:border-0 transition-all flex items-center justify-center select-none ${
                              isBooked 
                                ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' 
                                : 'bg-gray-50 text-transparent'
                            }`}
                            title={isBooked ? `🚨 ${slot.client} (${slot.time})` : `Volno (${slot.time})`}
                          >
                            {isBooked && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                            {!isBooked && slot.time.split(':')[1] === '00' && (
                              <span className="text-[8px] opacity-10 text-gray-900">•</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* 2. BLOK: 10 NEJBLIŽŠÍCH TRÉNINKŮ */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-purple-600" /> 10 nejbližších tréninků
          </h2>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b">
                  <th className="p-4">Datum a čas</th>
                  <th className="p-4">Klient</th>
                  <th className="p-4 text-center">Věk</th>
                  <th className="p-4">Typ tréninku</th>
                  <th className="p-4 text-center">Absolvované lekce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {upcomingTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                      Žádné nadcházející rezervace nebyly nalezeny.
                    </td>
                  </tr>
                ) : (
                  upcomingTrainings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-bold text-gray-700">
                        {new Date(b.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })} v {b.time}
                      </td>
                      <td className="p-4 font-extrabold text-purple-900">
                        {/* ✅ Data se berou bezpečně skrze JOIN z tabulky profiles */}
                        {b.profiles?.full_name || 'Neznámý klient'}
                      </td>
                      <td className="p-4 text-center text-gray-600 font-semibold">
                        {b.profiles?.age ? `${b.profiles.age} let` : '-'}
                      </td>
                      <td className="p-4">
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-100">
                          EMS Trénink
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold">
                          {b.profiles?.completed_trainings || 0} ×
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}