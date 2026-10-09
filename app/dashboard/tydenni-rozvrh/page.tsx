'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { StepBack, StepForward } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { exceptionTypeForSlot, findExceptionForSlot, getIsoWeekDays, timeToMinutes } from '../../../lib/availability';

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

type SlotStatus = 'REGULAR_WORKING' | 'EXTRA_WORKING' | 'BLOCKED' | 'OFF';
type AvailabilityRow = { day_of_week: number; start_time: string; end_time: string };
type ExceptionRow = { id: string; date: string; start_time: string; end_time: string; type: 'AVAILABLE' | 'UNAVAILABLE' };

const getWeekDays = (weekOffset = 0) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  };
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return getIsoWeekDays(todayISO, weekOffset).map(day => {
    const date = new Date(`${day.isoString}T00:00:00Z`);
    return {
      ...day,
      formatted: date.toLocaleDateString('cs-CZ', options),
      isToday: day.isoString === todayISO,
    };
  });
};

export default function WeeklySchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const [regularHours, setRegularHours] = useState<AvailabilityRow[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const savingSlots = useRef(new Set<string>());

  const currentWeekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const fetchData = async (id: string) => {
    const { data: reg, error: regErr } = await supabase
      .from('trainer_availability')
      .select('*')
      .eq('trainer_id', id);

    const { data: exc, error: excErr } = await supabase
      .from('trainer_exceptions')
      .select('*')
      .eq('trainer_id', id);

    if (regErr) console.error('Chyba načítání šablony:', regErr.message);
    if (excErr) console.error('Chyba načítání výjimek:', excErr.message);

    if (reg) setRegularHours(reg);
    if (exc) setExceptions(exc);
    setLoading(false);
  };

  useEffect(() => {
    const checkTrainer = async () => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        router.push('/prihlaseni');
        return;
      }
      
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profErr || !profile || !['TRAINER', 'ADMIN'].includes(profile.role)) {
        router.push('/dashboard');
        return;
      }

      setTrainerId(user.id);
      fetchData(user.id);
    };

    checkTrainer();
  }, [router]);

  const getEndTime = (startTime: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const endM = m + 30;
    const endH = endM === 60 ? h + 1 : h;
    const endMStr = endM === 60 ? '00' : '30';
    return `${endH.toString().padStart(2, '0')}:${endMStr}`;
  };

  const normalizeTime = (value: string) => {
    const minutes = timeToMinutes(value);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleExceptionClick = async (
    dateStr: string, 
    slotTime: string, 
    currentStatus: SlotStatus
  ) => {
    if (!trainerId) return;

    const slotKey = `${dateStr}-${slotTime}`;
    if (savingSlots.current.size > 0) return;
    savingSlots.current.add(slotKey);

    try {
      // Re-read this unique key immediately before writing. The local React
      // state may be stale if another click/tab inserted the row since fetch.
      const { data: existingRows, error: lookupError } = await supabase
        .from('trainer_exceptions')
        .select('id, type, start_time, end_time')
        .eq('trainer_id', trainerId)
        .eq('date', dateStr)
        .lte('start_time', normalizeTime(slotTime))
        .gt('end_time', normalizeTime(slotTime))
        .order('start_time', { ascending: false })
        .limit(1);

      if (lookupError) throw lookupError;

      const existingException = existingRows?.[0];
      if (existingException) {
        const selectedSlotEnd = getEndTime(slotTime);
        const hasRemainingRange = timeToMinutes(existingException.end_time) > timeToMinutes(selectedSlotEnd);

        // Exceptions may span several slots. Preserve both remaining pieces
        // before replacing the original row with the selected slot's new state.
        const hasLeadingRange = timeToMinutes(existingException.start_time) < timeToMinutes(slotTime);
        if (hasRemainingRange) {
          const { error: tailError } = await supabase
            .from('trainer_exceptions')
            .insert({
              trainer_id: trainerId,
              date: dateStr,
              start_time: selectedSlotEnd,
              end_time: existingException.end_time,
              type: existingException.type,
            });
          if (tailError) throw tailError;
        }

        if (hasLeadingRange) {
          const { error: leadingError } = await supabase
            .from('trainer_exceptions')
            .insert({
              trainer_id: trainerId,
              date: dateStr,
              start_time: existingException.start_time,
              end_time: normalizeTime(slotTime),
              type: existingException.type,
            });
          if (leadingError) throw leadingError;
        }

        const { error } = await supabase
          .from('trainer_exceptions')
          .delete()
          .eq('id', existingException.id);
        if (error) throw error;
      } else {
        const type = exceptionTypeForSlot(currentStatus);
        const { error } = await supabase
          .from('trainer_exceptions')
          .upsert({
            trainer_id: trainerId,
            date: dateStr,
            start_time: normalizeTime(slotTime),
            end_time: getEndTime(slotTime),
            type,
          }, { onConflict: 'trainer_id,date,start_time' });

        if (error) throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Neznámá chyba';
      console.error('Chyba při ukládání výjimky:', message);
      alert(`Chyba při ukládání: ${message}`);
    } finally {
      try {
        await fetchData(trainerId);
      } finally {
        savingSlots.current.delete(slotKey);
      }
    }
  };

  const calculatedDaysMatrix = useMemo(() => {
    return currentWeekDays.map(day => {
      const slots = GENERATED_SLOTS.map(slot => {
        const dayException = findExceptionForSlot(exceptions, day.isoString, slot);
        
        if (dayException) {
          return {
            time: slot,
            status: (dayException.type === 'UNAVAILABLE' ? 'BLOCKED' : 'EXTRA_WORKING') as SlotStatus
          };
        }
        
        const isRegularWork = regularHours.some(
          r => r.day_of_week === day.dayOfWeek && timeToMinutes(slot) >= timeToMinutes(r.start_time) && timeToMinutes(slot) < timeToMinutes(r.end_time)
        );

        return {
          time: slot,
          status: (isRegularWork ? 'REGULAR_WORKING' : 'OFF') as SlotStatus
        };
      });

      return { ...day, slots };
    });
  }, [currentWeekDays, regularHours, exceptions]);

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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operativní plán 📅</h1>
            <p className="text-gray-500 mt-1">
              Upravuj časy pro konkrétní dny. Změny zde nepřepíšou dlouhodobou šablonu, platí jen pro dané datum.
            </p>
          </div>

          <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 select-none items-center self-start md:self-auto">
            <button 
              onClick={() => setWeekOffset(prev => prev - 1)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-indigo-600"
              title="Předchozí týden"
            >
              <StepBack size={18}/>
            </button>
            <div className="px-4 py-1.5 font-bold text-sm flex items-center min-w-[120px] justify-center text-gray-700">
              {weekOffset === 0 ? 'Tento týden' : `${weekOffset > 0 ? '+' : ''}${weekOffset} týd`}
            </div>
            <button 
              onClick={() => setWeekOffset(prev => prev + 1)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-indigo-600"
              title="Další týden"
            >
              <StepForward size={18}/>
            </button>
          </div>
        </header>

        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">

          <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 px-1">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500" /> Běžná práce</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-blue-500" /> Práce navíc</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-500" /> Zrušená práce</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200" /> Volno</div>
          </div>

          <div className="overflow-x-auto min-w-full pt-2">
            <div className="inline-block min-w-[950px] w-full">
              
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

              <div className="space-y-2.5">
                {calculatedDaysMatrix.map(day => (
                  <div key={day.isoString} className="flex items-center group">
                    
                    <div className="w-36 shrink-0 text-sm flex flex-col justify-center leading-tight">
                      <span className="font-extrabold text-gray-800">{day.formatted}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${day.isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {day.isToday ? 'Dnes' : DAYS_NAMES[day.dayOfWeek]}
                      </span>
                    </div>

                    <div className="flex-1 flex h-12 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                      {day.slots.map(slot => {
                        let bgClass = 'bg-gray-100 hover:bg-blue-200';
                        
                        if (slot.status === 'REGULAR_WORKING') bgClass = 'bg-emerald-500 hover:bg-red-600';
                        if (slot.status === 'EXTRA_WORKING') bgClass = 'bg-blue-500 hover:bg-gray-200';
                        if (slot.status === 'BLOCKED') bgClass = 'bg-red-500 hover:bg-emerald-600';

                        return (
                          <div
                            key={slot.time}
                            onClick={() => handleExceptionClick(day.isoString, slot.time, slot.status)}
                            className={`flex-1 cursor-pointer border-r border-gray-200/40 last:border-0 transition-all flex flex-col items-center justify-center select-none ${bgClass}`}
                            title={`${day.formatted} v ${slot.time} – ${
                              slot.status === 'REGULAR_WORKING' ? 'Běžná práce' :
                              slot.status === 'EXTRA_WORKING' ? 'Mimořádná práce navíc' :
                              slot.status === 'BLOCKED' ? 'Mimořádné volno' : 'Volno'
                            }`}
                          >
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
