'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { Calendar as CalendarIcon, Clock, User, StepBack, StepForward, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface DbTrainer { id: string; first_name: string; last_name: string; }
interface TrainerAvailability { trainer_id: string; day_of_week: number; start_time: string; end_time: string; }
interface TrainerException { trainer_id: string; date: string; start_time: string; end_time: string; type: 'AVAILABLE' | 'UNAVAILABLE'; }
interface ExistingReservation { trainer_id: string | null; date: string; time: string; }

// Pomocná funkce pro dopočítání konce lekce (+30 minut)
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

export default function NewLessonPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = tento týden, 1 = příští atd.
  
  const [userId, setUserId] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<DbTrainer[]>([]);
  const [availabilities, setAvailabilities] = useState<TrainerAvailability[]>([]);
  const [exceptions, setExceptions] = useState<TrainerException[]>([]);
  const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([]);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('Jakýkoliv trenér');

  // 1. GENERUJE DNY OD PONDĚLÍ DO NEDĚLE PRO DANÝ TÝDEN
  const upcomingDays = useMemo(() => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'numeric' };
    
    const today = new Date();
    const todayTarget = new Date(today.getTime());
    
    // Posuneme se na pondělí aktuálního týdne (v JS: 0 = neděle, 1 = pondělí...)
    const currentDay = todayTarget.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; 
    
    todayTarget.setDate(todayTarget.getDate() + distanceToMonday + (weekOffset * 7));

    const todayISO = today.toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(todayTarget.getTime());
      d.setDate(d.getDate() + i);
      const isoString = d.toISOString().split('T')[0];
      
      // Vyresetujeme čas pro přesné porovnání dnů v minulosti
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

  // Nastavení výchozího dne, pokud se změní týden
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
    const initializePage = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/prihlaseni'); return; }
      setUserId(authUser.id);

      // Stahujeme rezervace CONFIRMED i PENDING, abychom správně spočítali kapacity volných trenérů
      const [t, a, e, r] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name').eq('role', 'TRAINER'),
        supabase.from('trainer_availability').select('*'),
        supabase.from('trainer_exceptions').select('*'),
        supabase.from('reservations').select('trainer_id, date, time').in('status', ['CONFIRMED', 'PENDING'])
      ]);

      if (t.data) setTrainers(t.data);
      if (a.data) setAvailabilities(a.data);
      if (e.data) setExceptions(e.data);
      if (r.data) setExistingReservations(r.data);
    };
    initializePage();
  }, [router]);

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

  // 2. STAV ČASOVÝCH SLOTŮ
  const timeSlotsWithStatus = useMemo(() => {
    if (!selectedDate) return [];
    const dayInfo = upcomingDays.find(d => d.isoString === selectedDate);
    if (!dayInfo) return [];

    return ALL_TIME_SLOTS.map(slot => {
      // 1. Kteří trenéři v tento čas vůbec mají vypsanou pracovní dobu
      const workingTrainers = trainers.filter(t => {
        const hasAvailability = availabilities.some(a => a.trainer_id === t.id && a.day_of_week === dayInfo.dayOfWeek && isTimeBetween(slot, a.start_time, a.end_time));
        const hasExtra = exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'AVAILABLE' && isTimeBetween(slot, e.start_time, e.end_time));
        const isUnavailable = exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'UNAVAILABLE' && isTimeBetween(slot, e.start_time, e.end_time));
        return (hasAvailability || hasExtra) && !isUnavailable;
      });

      // 2. Najdeme všechny rezervace na tento den a čas
      const reservationsAtSlot = existingReservations.filter(r => r.date === selectedDate && r.time === slot);
      
      // ID konkrétních trenérů, kteří už mají plno
      const bookedIds = reservationsAtSlot.filter(r => r.trainer_id !== null).map(r => r.trainer_id) as string[];
      
      // Počet rezervací typu "Jakýkoliv trenér" (které zatím nemají přiřazené ID)
      const unassignedReservationsCount = reservationsAtSlot.filter(r => r.trainer_id === null).length;

      // Trenéři, kteří mají čas a nemají v systému přímou rezervaci na své ID
      const explicitAvailableTrainers = workingTrainers.filter(t => !bookedIds.includes(t.id));

      // Pokud v systému visí nějaké neobsazené "Jakýkoliv trenér" lekce, virtuálně snížíme počet dostupných trenérů (předpokládáme, že si je rozeberou)
      const availableTrainersNow = explicitAvailableTrainers.slice(unassignedReservationsCount);

      let isSlotUnavailable = false;
      
      if (selectedTrainer === 'Jakýkoliv trenér') {
        if (availableTrainersNow.length === 0) isSlotUnavailable = true;
      } else {
        const isWorking = workingTrainers.some(t => t.id === selectedTrainer);
        // Trenér je obsazen, pokud má přímou rezervaci NEBO pokud už zbývající volní trenéři nepokryjí "Jakýkoliv trenér" frontu
        const isBooked = bookedIds.includes(selectedTrainer) || !availableTrainersNow.some(t => t.id === selectedTrainer);
        if (!isWorking || isBooked) isSlotUnavailable = true;
      }

      return { 
        time: slot, 
        isUnavailable: isSlotUnavailable, 
        availableTrainers: availableTrainersNow 
      };
    });
  }, [selectedDate, selectedTrainer, trainers, availabilities, exceptions, existingReservations, upcomingDays]);

  const isSelectedDateToday = useMemo(() => upcomingDays.find(d => d.isoString === selectedDate)?.isToday || false, [selectedDate, upcomingDays]);
  const intentToBookTodayOrPast = useMemo(() => {
    const day = upcomingDays.find(d => d.isoString === selectedDate);
    return day ? (day.isToday || day.isPast) : false;
  }, [selectedDate, upcomingDays]);

  // VLASTNÍ REZERVACE
  const handleBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTime || !selectedDate || !userId || intentToBookTodayOrPast) return;
    
    setSubmitting(true);
    setError('');

    try {
      let targetTrainerId: string | null = null;
      let trainerFullName = '';
      let reservationStatus = 'CONFIRMED';

      if (selectedTrainer === 'Jakýkoliv trenér') {
        // Ověříme na frontendu, jestli je vůbec v poli volný slot pro kohokoliv
        const currentSlot = timeSlotsWithStatus.find(s => s.time === selectedTime);
        if (!currentSlot || currentSlot.availableTrainers.length === 0) {
          throw new Error('V tento čas již není žádný trenér k dispozici.');
        }

        // Pro "Jakýkoliv trenér" schválně neukládáme ID prvního nalezeného. Necháme null a stav dáme PENDING.
        targetTrainerId = null;
        trainerFullName = 'Jakýkoliv trenér (Čeká na přiřazení)';
        reservationStatus = 'PENDING';
      } else {
        // Pro konkrétního vybraného trenéra funguje proces postaru
        const t = trainers.find(trainer => trainer.id === selectedTrainer);
        targetTrainerId = selectedTrainer;
        trainerFullName = t ? `${t.first_name} ${t.last_name}` : 'Neznámý trenér';
        reservationStatus = 'CONFIRMED';
      }

      const { error: dbError } = await supabase.from('reservations').insert([{
        user_id: userId, 
        date: selectedDate, 
        time: selectedTime, 
        trainer: trainerFullName, 
        trainer_id: targetTrainerId, 
        status: reservationStatus
      }]);

      if (dbError) throw dbError;

      if (reservationStatus === 'PENDING') {
        alert('Rezervace úspěšně odeslána! Trenéři obdrží upozornění a termín potvrdí.');
      } else {
        alert('Rezervace úspěšně vytvořena!');
      }
      
      router.push('/dashboard/rezervace');
    } catch (err: any) {
      setError(err.message || 'Při ukládání rezervace došlo k chybě.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Rezervace tréninku ⚡</h1>
          <p className="text-gray-500">Vyber si svůj čas a trenéra.</p>
          {error && <p className="text-red-500 font-bold mt-2">{error}</p>}
        </header>

        <div className="space-y-10">
          {/* 1. VÝBĚR TRENÉRA */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={14} /> 1. Výběr trenéra
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => { setSelectedTrainer('Jakýkoliv trenér'); setSelectedTime(''); }} 
                className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${selectedTrainer === 'Jakýkoliv trenér' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-white bg-white hover:border-gray-200'}`}
              >
                Jakýkoliv trenér
              </button>
              {trainers.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setSelectedTrainer(t.id); setSelectedTime(''); }} 
                  className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${selectedTrainer === t.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-white bg-white hover:border-gray-200'}`}
                >
                  {t.first_name} {t.last_name}
                </button>
              ))}
            </div>
          </section>

          {/* 2. VÝBĚR DNE */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon size={14} /> 2. Výběr dnu
              </h2>
              {weekOffset > 0 && (
                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                  +{weekOffset}. týden
                </span>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
              
              {/* TLAČÍTKO ZPĚT */}
              <button 
                onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                disabled={weekOffset === 0}
                className={`
                  flex-shrink-0 min-w-[100px] h-[76px] px-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center
                  ${weekOffset === 0 
                    ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed opacity-40' 
                    : 'bg-white border-white hover:border-gray-200 text-gray-500 hover:text-emerald-600 shadow-sm'}
                `}
                title="Předchozí týden"
              >
                <div className="text-[10px] uppercase opacity-70 mb-1">Týden</div>
                <StepBack size={20} />
              </button>

              {/* SEZNAM DNŮ */}
              {upcomingDays.map((d) => {
                const isSelected = selectedDate === d.isoString;
                return (
                  <button 
                    key={d.isoString} 
                    disabled={d.isPast}
                    onClick={() => { setSelectedDate(d.isoString); setSelectedTime(''); }} 
                    className={`
                      flex-shrink-0 min-w-[100px] px-4 py-3 rounded-2xl border-2 font-bold transition-all
                      ${d.isPast 
                        ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed opacity-50' 
                        : isSelected 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                          : 'bg-white border-white hover:border-gray-200 text-gray-800 shadow-sm'}
                    `}
                  >
                    <div className="text-[10px] uppercase opacity-70 mb-1">
                      {d.isToday ? 'Dnes' : d.formatted.split(' ')[0]}
                    </div>
                    <div className="text-lg">{d.formatted.split(' ')[1]}</div>
                  </button>
                );
              })}

              {/* TLAČÍTKO VPŘED */}
              <button 
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="flex-shrink-0 min-w-[100px] h-[76px] px-4 rounded-2xl border-2 bg-white border-white hover:border-gray-200 text-gray-500 hover:text-emerald-600 font-bold transition-all flex flex-col items-center justify-center shadow-sm"
                title="Další týden"
              >
                <div className="text-[10px] uppercase opacity-70 mb-1">Týden</div>
                <StepForward size={20} />
              </button>

            </div>
          </section>

          {/* 3. DOSTUPNÁ OKNA */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={14} /> 3. Dostupná okna
            </h2>
            
            {isSelectedDateToday && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs flex items-center gap-2 shadow-sm animate-pulse">
                <Info size={14} className="shrink-0" /> 
                <span><strong>Prohlížíte dnešní den:</strong> Online rezervace jsou třeba dělat minimálně den předem.</span>
              </div>
            )}

            {/* Mírně zvětšená šířka gridu ze sm:grid-cols-4 na sm:grid-cols-3/md:grid-cols-4, aby se čas "od-do" pohodlně vešel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {timeSlotsWithStatus.map((s) => {
                const isSelected = selectedTime === s.time;
                const showAsAvailable = !s.isUnavailable;

                return (
                  <div 
                    key={s.time}
                    onClick={() => showAsAvailable && !isSelectedDateToday && setSelectedTime(s.time)}
                    className={`
                      relative group p-4 rounded-2xl border-2 transition-all overflow-hidden text-center
                      ${!showAsAvailable 
                        ? 'bg-gray-100 border-transparent cursor-not-allowed opacity-50' 
                        : isSelectedDateToday
                          ? 'bg-white border-gray-200 cursor-default shadow-sm' 
                          : isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md cursor-pointer' 
                            : 'bg-white border-white hover:border-emerald-200 cursor-pointer'}
                    `}
                  >
                    {/* TADY: Zobrazení rozsahu od - do */}
                    <div className={`font-bold text-base mb-1 ${!showAsAvailable ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {s.time} – {calculateEndTime(s.time)}
                    </div>
                    
                    {selectedTrainer === 'Jakýkoliv trenér' && showAsAvailable && (
                      <div className={`text-[9px] uppercase tracking-tighter truncate ${isSelected ? 'text-emerald-100' : 'text-green-600'}`}>
                        {s.availableTrainers
                          .map(t => `${t.first_name || ''} ${t.last_name || ''}`.trim())
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                    
                    {!showAsAvailable && (
                      <div className="text-[9px] uppercase text-gray-400 font-bold">Obsazeno</div>
                    )}
                    {showAsAvailable && isSelectedDateToday && (
                      <div className="text-[9px] uppercase text-amber-600 font-bold">Nelze objednat</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* POTVRZOVACÍ TLAČÍTKO */}
          <button 
            onClick={() => handleBooking()}
            disabled={!selectedTime || submitting || intentToBookTodayOrPast} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold py-5 rounded-3xl transition-all shadow-xl shadow-emerald-100 enabled:hover:scale-[1.01] enabled:active:scale-[0.99]"
          >
            {intentToBookTodayOrPast && selectedTime
              ? 'Dnešní termíny nelze rezervovat' 
              : submitting 
                ? 'Zpracovávám...' 
                : selectedTrainer === 'Jakýkoliv trenér'
                  ? 'Odeslat žádost trenérům'
                  : 'Potvrdit trénink'}
          </button>
        </div>
      </main>
    </div>
  );
}