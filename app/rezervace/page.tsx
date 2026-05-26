'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DbTrainer { id: string; }
interface TrainerAvailability { trainer_id: string; day_of_week: number; start_time: string; end_time: string; }
interface TrainerException { trainer_id: string; date: string; start_time: string; end_time: string; type: 'AVAILABLE' | 'UNAVAILABLE'; }
interface ExistingReservation { trainer_id: string | null; date: string; time: string; }

const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endMinutes = minutes + 30;
  let endHours = hours;
  
  if (endMinutes >= 60) {
    endMinutes -= 60;
    endHours += 1;
  }
  
  const hStr = endHours.toString().padStart(2, '0');
  const mStr = endMinutes.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
};

export default function PublicLessonPage() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  
  const [trainers, setTrainers] = useState<DbTrainer[]>([]);
  const [availabilities, setAvailabilities] = useState<TrainerAvailability[]>([]);
  const [exceptions, setExceptions] = useState<TrainerException[]>([]);
  const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([]);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const upcomingDays = useMemo(() => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'numeric' };
    
    const today = new Date();
    const todayTarget = new Date(today.getTime());
    
    const currentDay = todayTarget.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; 
    
    todayTarget.setDate(todayTarget.getDate() + distanceToMonday + (weekOffset * 7));

    const todayISO = today.toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(todayTarget.getTime());
      d.setDate(d.getDate() + i);
      const isoString = d.toISOString().split('T')[0];
      
      const compareDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push({
        isoString,
        formatted: d.toLocaleDateString('cs-CZ', options),
        dayOfWeek: d.getDay(),
        isToday: isoString === todayISO,
        isPast: compareDate < compareToday
      });
    }
    return days;
  }, [weekOffset]);

  useEffect(() => {
    if (upcomingDays.length > 0) {
      const isSelectedDayInWeek = upcomingDays.some(d => d.isoString === selectedDate);
      if (!isSelectedDayInWeek) {
        const firstValidDay = upcomingDays.find(d => !d.isPast) || upcomingDays[0];
        setSelectedDate(firstValidDay.isoString);
        setSelectedTime('');
      }
    }
  }, [upcomingDays, selectedDate]);

  useEffect(() => {
    const loadPublicData = async () => {
      const [t, a, e, r] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'TRAINER'),
        supabase.from('trainer_availability').select('*'),
        supabase.from('trainer_exceptions').select('*'),
        supabase.from('reservations').select('trainer_id, date, time').in('status', ['CONFIRMED', 'PENDING'])
      ]);

      if (t.data) setTrainers(t.data);
      if (a.data) setAvailabilities(a.data);
      if (e.data) setExceptions(e.data);
      if (r.data) setExistingReservations(r.data);
    };
    loadPublicData();
  }, []);

  const isTimeBetween = (time: string, start: string, end: string) => time >= start && time < end;

  const ALL_TIME_SLOTS = useMemo(() => {
    const slots = [];
    for (let minutes = 360; minutes < 1140; minutes += 30) {
      const startHour = Math.floor(minutes / 60);
      const startMin = minutes % 60;
      slots.push(`${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`);
    }
    return slots;
  }, []);

  const timeSlotsWithStatus = useMemo(() => {
    if (!selectedDate) return [];
    const dayInfo = upcomingDays.find(d => d.isoString === selectedDate);
    if (!dayInfo) return [];

    return ALL_TIME_SLOTS.map(slot => {
      const workingTrainers = trainers.filter(t => {
        const hasAvailability = availabilities.some(a => a.trainer_id === t.id && a.day_of_week === dayInfo.dayOfWeek && isTimeBetween(slot, a.start_time, a.end_time));
        const hasExtra = exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'AVAILABLE' && isTimeBetween(slot, e.start_time, e.end_time));
        const isUnavailable = exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'UNAVAILABLE' && isTimeBetween(slot, e.start_time, e.end_time));
        return (hasAvailability || hasExtra) && !isUnavailable;
      });

      const reservationsAtSlot = existingReservations.filter(r => r.date === selectedDate && r.time === slot);
      const isRoomOccupied = reservationsAtSlot.length > 0;

      let isSlotUnavailable = false;

      if (isRoomOccupied) {
        isSlotUnavailable = true;
      } else if (workingTrainers.length === 0) {
        isSlotUnavailable = true;
      }

      return { 
        time: slot, 
        isUnavailable: isSlotUnavailable
      };
    });
  }, [selectedDate, trainers, availabilities, exceptions, existingReservations, upcomingDays]);

  const isSelectedDateToday = useMemo(() => upcomingDays.find(d => d.isoString === selectedDate)?.isToday || false, [selectedDate, upcomingDays]);
  const intentToBookTodayOrPast = useMemo(() => {
    const day = upcomingDays.find(d => d.isoString === selectedDate);
    return day ? (day.isToday || day.isPast) : false;
  }, [selectedDate, upcomingDays]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 p-4 md:p-10 max-w-5xl mx-auto w-full">
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Obsazenost studia 🏋️</h1>
            <p className="text-sm text-gray-500">Podívej se na volné termíny před rezervací.</p>
          </div>
          <button 
            onClick={() => router.push('/prihlaseni')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm text-sm transition-all self-start sm:self-center"
          >
            <LogIn size={16} /> Přihlásit se
          </button>
        </header>

        <div className="space-y-8 md:space-y-10">
          
          {/* 1. VÝBĚR DNE */}
          <section>
            <div className="flex sm:items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon size={14} /> 1. Výběr dnu
              </h2>
            </div>
            
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
              
              {/* OVLÁDÁNÍ TÝDNŮ */}
              <div className="col-span-3 sm:col-span-1 flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm sm:min-w-[140px]">
                <button 
                  onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                  disabled={weekOffset === 0}
                  className={`p-1.5 rounded-lg transition-all ${weekOffset === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'}`}
                  title="Předchozí týden"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[11px] font-black px-1 text-gray-500 uppercase tracking-tight text-center whitespace-nowrap">
                  {weekOffset === 0 ? 'Tento týd.' : `+${weekOffset}. týd.`}
                </span>
                <button 
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  className="p-1.5 text-gray-600 hover:bg-gray-50 hover:text-emerald-600 rounded-lg transition-all"
                  title="Další týden"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* SEZNAM DNŮ */}
              {upcomingDays.map((d, index) => {
                const isSelected = selectedDate === d.isoString;
                const isLastOnMobile = index === 6;

                const parts = d.formatted.split(' ');
                const dayName = parts[0];
                const dayDate = parts.slice(1).join(' ');

                return (
                  <button 
                    key={d.isoString} 
                    disabled={d.isPast}
                    onClick={() => { setSelectedDate(d.isoString); setSelectedTime(''); }} 
                    className={`
                      px-1 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 font-bold transition-all text-center sm:min-w-[100px]
                      ${isLastOnMobile ? 'col-span-3 sm:col-span-1' : ''}
                      ${d.isPast 
                        ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed opacity-40' 
                        : isSelected 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100' 
                          : 'bg-white border-white hover:border-gray-200 text-gray-800 shadow-sm'}
                    `}
                  >
                    <div className="text-[9px] md:text-[10px] uppercase opacity-75 mb-0.5 truncate">
                      {d.isToday ? 'Dnes' : dayName}
                    </div>
                    <div className="text-xs md:text-base tracking-tight whitespace-nowrap">{dayDate}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. DOSTUPNÁ OKNA */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={14} /> 2. Stav oken
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {timeSlotsWithStatus.map((s) => {
                const isSelected = selectedTime === s.time;
                const showAsAvailable = !s.isUnavailable;

                return (
                  <div 
                    key={s.time}
                    onClick={() => showAsAvailable && !isSelectedDateToday && setSelectedTime(s.time)}
                    className={`
                      relative group p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all overflow-hidden text-center
                      ${!showAsAvailable 
                        ? 'bg-gray-100 border-transparent cursor-not-allowed opacity-50' 
                        : isSelectedDateToday
                          ? 'bg-white border-gray-200 cursor-default shadow-sm' 
                          : isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md cursor-pointer' 
                            : 'bg-white border-white hover:border-emerald-200 cursor-pointer'}
                    `}
                  >
                    <div className={`font-bold text-sm md:text-base mb-0.5 ${!showAsAvailable ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {s.time} – {calculateEndTime(s.time)}
                    </div>
                    
                    {/* Pokud je volno, vypíše se vždycky čistě "Volno" */}
                    {showAsAvailable ? (
                      <div className={`text-[8px] md:text-[9px] uppercase font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-600'}`}>
                        Volno
                      </div>
                    ) : (
                      <div className="text-[8px] md:text-[9px] uppercase text-gray-400 font-bold">Obsazeno</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* PRESMĚROVÁVACÍ TLAČÍTKO */}
          <button 
            onClick={() => router.push('/prihlaseni')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 md:py-5 text-sm md:text-base rounded-2xl md:rounded-3xl transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            <LogIn size={18} />
            {selectedTime && !intentToBookTodayOrPast
              ? `Chci rezervovat čas ${selectedTime} (Vyžaduje přihlášení)` 
              : 'Pro rezervaci se nejprve přihlaste'}
          </button>
        </div>
      </main>
    </div>
  );
}