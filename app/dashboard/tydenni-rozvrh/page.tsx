'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';


const DAYS_NAMES: { [key: number]: string } = {
  1: 'Pondělí', 2: 'Úterý', 3: 'Středa', 4: 'Čtvrtek', 5: 'Pátek', 6: 'Sobota', 0: 'Neděle'
};

// Generátor 26 časových slotů (06:00 až 18:30 -> pokrývá čas do 19:00)
const GENERATED_SLOTS = (() => {
  const slots = [];
  for (let hour = 6; hour <= 18; hour++) {
    const hStr = hour.toString().padStart(2, '0');
    slots.push(`${hStr}:00`);
    slots.push(`${hStr}:30`);
  }
  return slots;
})();

// Dynamický generátor 7 nadcházejících dní (Dnes + 6 dní)
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

export default function WeeklySchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  // Stavy pro data z DB
  const [regularHours, setRegularHours] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);

  // Pole 7 dní vygenerované jednou při načtení
  const upcomingSevenDays = useMemo(() => getNextSevenDays(), []);

  const fetchData = async (id: string) => {
    const { data: reg } = await supabase.from('trainer_availability').select('*').eq('trainer_id', id);
    const { data: exc } = await supabase.from('trainer_exceptions').select('*').eq('trainer_id', id);
    if (reg) setRegularHours(reg);
    if (exc) setExceptions(exc);
    setLoading(false);
  };

  useEffect(() => {
    const checkTrainer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/prihlaseni');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'TRAINER') {
        router.push('/dashboard');
        return;
      }
      setTrainerId(user.id);
      fetchData(user.id);
    };
    checkTrainer();
  }, [router]);

  // Pomocná funkce pro výpočet konce slotu (+30 min)
  const getEndTime = (startTime: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const endM = m + 30;
    const endH = endM === 60 ? h + 1 : h;
    const endMStr = endM === 60 ? '00' : '30';
    return `${endH.toString().padStart(2, '0')}:${endMStr}`;
  };

  // Správa kliknutí na operační timeline
  const handleExceptionClick = async (dateStr: string, slotTime: string, currentStatus: 'REGULAR_WORKING' | 'EXTRA_WORKING' | 'BLOCKED' | 'OFF') => {
    if (!trainerId) return;

    const existingException = exceptions.find(e => e.date === dateStr && e.start_time === slotTime);

    if (existingException) {
      // Smazáním stávající výjimky vrátíme původní stav ze šablony
      await supabase.from('trainer_exceptions').delete().eq('id', existingException.id);
    } else {
      // Vytváříme novou výjimku na základě aktuálního stavu:
      // Pokud byla zelená (REGULAR_WORKING) -> chceme červené volno (UNAVAILABLE)
      // Pokud byla šedá (OFF) -> chceme modrou práci navíc (AVAILABLE)
      const newType = currentStatus === 'REGULAR_WORKING' ? 'UNAVAILABLE' : 'AVAILABLE';
      
      await supabase.from('trainer_exceptions').insert([{
        trainer_id: trainerId,
        date: dateStr,
        start_time: slotTime,
        end_time: getEndTime(slotTime),
        type: newType
      }]);
    }
    fetchData(trainerId);
  };

  // Výpočet výsledné matice (Zrcadlení šablony + aplikace výjimek)
  const calculatedDaysMatrix = useMemo(() => {
    return upcomingSevenDays.map(day => {
      const slots = GENERATED_SLOTS.map(slot => {
        const dayException = exceptions.find(e => e.date === day.isoString && slot >= e.start_time && slot < e.end_time);
        
        if (dayException) {
          return {
            time: slot,
            status: dayException.type === 'UNAVAILABLE' ? 'BLOCKED' : 'EXTRA_WORKING'
          };
        }
        
        const isRegularWork = regularHours.some(r => r.day_of_week === day.dayOfWeek && slot >= r.start_time && slot < r.end_time);
        return {
          time: slot,
          status: isRegularWork ? 'REGULAR_WORKING' : 'OFF'
        };
      });

      return { ...day, slots };
    });
  }, [upcomingSevenDays, regularHours, exceptions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl space-y-8 overflow-x-hidden">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Operativní plán (Tento týden) 📅</h1>
          <p className="text-gray-500 mt-1">
            Upravuj časy pro konkrétní dny. Změny zde nepřepíšou dlouhodobou šablonu, platí jen pro dané datum.
          </p>
        </header>

        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          {/* Informační nápověda */}
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 text-sm text-indigo-900">
            <Info size={20} className="shrink-0 mt-0.5 text-indigo-600" />
            <div>
              <span className="font-bold">Jak klikat výjimky:</span> 
              <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-90">
                <li>Kliknutím na <span className="text-emerald-600 font-bold">zelený slot</span> zrušíš tréninky v tento den (zčervená).</li>
                <li>Kliknutím na <span className="text-gray-500 font-bold">šedý slot</span> přidáš mimořádnou pracovní dobu navíc (zmodrá).</li>
                <li>Opětovným kliknutím na jakoukoliv výjimku (červenou/modrou) ji vymažeš a vrátíš čas do stavu podle šablony.</li>
              </ul>
            </div>
          </div>

          {/* Legenda barev */}
          <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 px-1">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500" /> Běžná práce (Ze šablony)</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-blue-500" /> Mimořádná práce navíc (Výjimka)</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-500" /> Mimořádné volno / Zrušeno (Výjimka)</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200" /> Standardní volno</div>
          </div>

          {/* Časová osa na 7 dní */}
          <div className="overflow-x-auto min-w-full pt-2">
            <div className="inline-block min-w-[950px] w-full">
              
              {/* Popisky hodin nad osou */}
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

              {/* 7 řádků (Dnes až +6 dní) */}
              <div className="space-y-2.5">
                {calculatedDaysMatrix.map(day => (
                  <div key={day.isoString} className="flex items-center group">
                    
                    {/* Levý sloupec s reálným datem */}
                    <div className="w-36 shrink-0 text-sm flex flex-col justify-center leading-tight">
                      <span className="font-extrabold text-gray-800">{day.formatted}</span>
                      <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                        {day.isToday ? 'Dnes' : DAYS_NAMES[day.dayOfWeek]}
                      </span>
                    </div>

                    {/* Spojená 26sloupcová časová osa bez mezer */}
                    <div className="flex-1 flex h-12 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                      {day.slots.map(slot => {
                        let bgClass = 'bg-gray-100 hover:bg-blue-200'; // Výchozí stav (Volno)
                        
                        if (slot.status === 'REGULAR_WORKING') bgClass = 'bg-emerald-500 hover:bg-red-600';
                        if (slot.status === 'EXTRA_WORKING') bgClass = 'bg-blue-500 hover:bg-gray-200';
                        if (slot.status === 'BLOCKED') bgClass = 'bg-red-500 hover:bg-emerald-600';

                        return (
                          <div
                            key={slot.time}
                            onClick={() => handleExceptionClick(day.isoString, slot.time, slot.status as any)}
                            className={`flex-1 cursor-pointer border-r border-gray-200/40 last:border-0 transition-all flex flex-col items-center justify-center select-none ${bgClass}`}
                            title={`${day.formatted} v ${slot.time} – ${
                              slot.status === 'REGULAR_WORKING' ? 'Běžná práce' :
                              slot.status === 'EXTRA_WORKING' ? 'Mimořádná práce navíc' :
                              slot.status === 'BLOCKED' ? 'Mimořádné volno' : 'Volno'
                            }`}
                          >
                            {/* Jemná tečka značící celou hodinu */}
                            <span className="text-[8px] font-medium opacity-20">
                              {slot.time.split(':')[1] === '00' ? '•' : ''}
                            </span>
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
      </main>
    </div>
  );
}