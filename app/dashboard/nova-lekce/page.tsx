'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../comp/Sidebar';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, Info, Coins, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface DbTrainer { id: string; first_name: string; last_name: string; email?: string; }
interface TrainerAvailability { trainer_id: string; day_of_week: number; start_time: string; end_time: string; }
interface TrainerException { trainer_id: string; date: string; start_time: string; end_time: string; type: 'AVAILABLE' | 'UNAVAILABLE'; }
interface ExistingReservation { trainer_id: string | null; date: string; time: string; user_id?: string; }

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.trim().split(':').map(Number);
  return hours * 60 + minutes;
};

const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endMinutes = minutes + 30;
  let endHours = hours;
  if (endMinutes >= 60) {
    endMinutes -= 60;
    endHours += 1;
  }
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

const getNextTimeSlot = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  let nextMinutes = minutes + 30;
  let nextHours = hours;
  if (nextMinutes >= 60) {
    nextMinutes -= 60;
    nextHours += 1;
  }
  return `${nextHours.toString().padStart(2, '0')}:${nextMinutes.toString().padStart(2, '0')}`;
};

const calculateFirstLessonEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endMinutes = minutes + 60;
  let endHours = hours;
  while (endMinutes >= 60) {
    endMinutes -= 60;
    endHours += 1;
  }
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

export default function NewLessonPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string; email?: string; credit_balance: number } | null>(null);
  const [trainers, setTrainers] = useState<DbTrainer[]>([]);
  const [availabilities, setAvailabilities] = useState<TrainerAvailability[]>([]);
  const [exceptions, setExceptions] = useState<TrainerException[]>([]);
  const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([]);
  const [userHasPreviousReservations, setUserHasPreviousReservations] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('Jakýkoliv trenér');

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
    const initializePage = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/prihlaseni'); return; }
      setUserId(authUser.id);

      // Načtení profilu včetně kreditů
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, credit_balance')
        .eq('id', authUser.id)
        .single();

      setUserProfile({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || authUser.email || '',
        credit_balance: profile?.credit_balance ?? 0,
      });

      const [t, a, e, r] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').eq('role', 'TRAINER'),
        supabase.from('trainer_availability').select('*'),
        supabase.from('trainer_exceptions').select('*'),
        supabase.from('reservations').select('trainer_id, date, time, user_id').in('status', ['CONFIRMED', 'PENDING'])
      ]);

      if (t.data) setTrainers(t.data);
      if (a.data) setAvailabilities(a.data);
      if (e.data) setExceptions(e.data);
      if (r.data) {
        setExistingReservations(r.data);
        const userResCount = r.data.filter(res => res.user_id === authUser.id).length;
        setUserHasPreviousReservations(userResCount > 0);
      }
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

  const timeSlotsWithStatus = useMemo(() => {
    if (!selectedDate) return [];
    const dayInfo = upcomingDays.find(d => d.isoString === selectedDate);
    if (!dayInfo) return [];

    const checkSlotValidity = (slot: string) => {
      const slotStartMin = timeToMinutes(slot);
      const slotEndMin = slotStartMin + 30;

      const workingTrainers = trainers.filter(t => {
        const hasAvailability = availabilities.some(a => a.trainer_id === t.id && a.day_of_week === dayInfo.dayOfWeek && isTimeBetween(slot, a.start_time, a.end_time));
        const hasExtra = exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'AVAILABLE' && isTimeBetween(slot, e.start_time, e.end_time));
        const isUnavailable = exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'UNAVAILABLE' && isTimeBetween(slot, e.start_time, e.end_time));
        return (hasAvailability || hasExtra) && !isUnavailable;
      });

      const reservationsAtSlot = existingReservations.filter(r => {
        if (r.date !== selectedDate) return false;
        let resStartMin = 0;
        let resEndMin = 0;
        if (r.time.includes('-')) {
          const [s, e] = r.time.split('-');
          resStartMin = timeToMinutes(s);
          resEndMin = timeToMinutes(e);
        } else {
          resStartMin = timeToMinutes(r.time);
          resEndMin = resStartMin + 30;
        }
        return slotStartMin < resEndMin && slotEndMin > resStartMin;
      });

      const isRoomOccupied = reservationsAtSlot.length > 0;
      let isUnavailable = false;

      if (isRoomOccupied) {
        isUnavailable = true;
      } else if (selectedTrainer === 'Jakýkoliv trenér') {
        if (workingTrainers.length === 0) isUnavailable = true;
      } else {
        const isWorking = workingTrainers.some(t => t.id === selectedTrainer);
        if (!isWorking) isUnavailable = true;
      }

      return { isUnavailable, workingTrainers };
    };

    return ALL_TIME_SLOTS.map(slot => {
      const firstSlotCheck = checkSlotValidity(slot);
      let finalIsUnavailable = firstSlotCheck.isUnavailable;
      let availableTrainers = firstSlotCheck.workingTrainers;

      if (!userHasPreviousReservations && !finalIsUnavailable) {
        const nextSlot = getNextTimeSlot(slot);
        const secondSlotCheck = checkSlotValidity(nextSlot);

        if (secondSlotCheck.isUnavailable) {
          finalIsUnavailable = true;
        } else if (selectedTrainer === 'Jakýkoliv trenér') {
          availableTrainers = firstSlotCheck.workingTrainers.filter(t1 => 
            secondSlotCheck.workingTrainers.some(t2 => t2.id === t1.id)
          );
          if (availableTrainers.length === 0) finalIsUnavailable = true;
        } else {
          const canDoBoth = secondSlotCheck.workingTrainers.some(t => t.id === selectedTrainer);
          if (!canDoBoth) finalIsUnavailable = true;
        }
      }

      return { 
        time: slot, 
        isUnavailable: finalIsUnavailable, 
        availableTrainers: finalIsUnavailable ? [] : availableTrainers 
      };
    });
  }, [selectedDate, selectedTrainer, trainers, availabilities, exceptions, existingReservations, upcomingDays, userHasPreviousReservations, ALL_TIME_SLOTS]);

  const isSelectedDateToday = useMemo(() => upcomingDays.find(d => d.isoString === selectedDate)?.isToday || false, [selectedDate, upcomingDays]);
  const intentToBookTodayOrPast = useMemo(() => {
    const day = upcomingDays.find(d => d.isoString === selectedDate);
    return day ? (day.isToday || day.isPast) : false;
  }, [selectedDate, upcomingDays]);

  const handleBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTime || !selectedDate || !userId || intentToBookTodayOrPast) return;

    if ((userProfile?.credit_balance ?? 0) < 1) {
      setError('Nemáte dostatek kreditů pro provedení rezervace.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const currentSlot = timeSlotsWithStatus.find(s => s.time === selectedTime);
      if (!currentSlot || currentSlot.isUnavailable) {
        throw new Error('Tento čas se mezitím obsadil nebo není k dispozici.');
      }

      let targetTrainerId: string | null = null;
      let trainerFullName = 'Jakýkoliv trenér';
      let trainerEmails: string[] = [];

      if (selectedTrainer !== 'Jakýkoliv trenér') {
        const t = trainers.find(trainer => trainer.id === selectedTrainer);
        if (t) {
          targetTrainerId = t.id;
          trainerFullName = `${t.first_name} ${t.last_name}`;
          if (t.email) trainerEmails.push(t.email);
        }
      }

      const customerFullName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Klient EMS';
      const customerEmail = userProfile?.email || '';

      const formattedTimeRange = userHasPreviousReservations 
        ? `${selectedTime} - ${calculateEndTime(selectedTime)}`
        : `${selectedTime} - ${calculateFirstLessonEndTime(selectedTime)}`;

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          trainer_id: targetTrainerId,
          date: selectedDate,
          time: formattedTimeRange,
          trainerName: trainerFullName,
          trainerEmails: trainerEmails,
          customerName: customerFullName,
          customerEmail: customerEmail,
          serviceName: userHasPreviousReservations ? 'EMS Trénink' : 'První vstupní EMS trénink',
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Při odesílání rezervace došlo k chybě.');
      }

      alert('Rezervace byla úspěšně vytvořena! 1 kredit byl odečten z vašeho účtu.');
      router.push('/dashboard/rezervace');
    } catch (err: any) {
      setError(err.message || 'Při ukládání rezervace došlo k chybě.');
      setSubmitting(false);
    }
  };

  const hasNoCredits = (userProfile?.credit_balance ?? 0) < 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />
      <main className="flex-1 p-4 md:p-10 max-w-5xl mx-auto w-full">
        
        {/* HLAVIČKA A KREDITY */}
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Rezervace tréninku ⚡</h1>
            <p className="text-sm text-gray-500 mt-1">
              {!userHasPreviousReservations 
                ? 'Jelikož je to váš první trénink, systém automaticky vybírá 1hodinový blok pro zaškolení a smlouvy.' 
                : 'Vyber si svůj čas a trenéra.'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-3 self-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Váš zůstatek</span>
              <span className="text-lg font-black text-gray-900">{userProfile?.credit_balance ?? 0} <span className="text-xs font-normal text-gray-500">kreditů</span></span>
            </div>
          </div>
        </header>

        {/* UPOZORNĚNÍ: NEDOSTATEK KREDITŮ */}
        {hasNoCredits && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex items-start gap-4 text-amber-900">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="font-bold text-sm md:text-base">Pro vytvoření rezervace potřebujete kredity</h3>
              <p className="text-xs md:text-sm text-amber-800">
                Na svém účtu máte aktuálně 0 kreditů. Každá rezervace odečte 1 kredit. Kredity si můžete zakoupit převodem nebo QR kódem.
              </p>
              <Link 
                href="/dashboard/kredity" 
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
              >
                Dobít kredity <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold text-sm">{error}</div>}

        <div className="space-y-8 md:space-y-10">
          {/* 1. VÝBĚR TRENÉRA */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <User size={14} /> 1. Výběr trenéra
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <button 
                onClick={() => { setSelectedTrainer('Jakýkoliv trenér'); setSelectedTime(''); }} 
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 text-xs md:text-sm font-bold transition-all ${selectedTrainer === 'Jakýkoliv trenér' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-white bg-white hover:border-gray-200'}`}
              >
                Jakýkoliv trenér
              </button>
              {trainers.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setSelectedTrainer(t.id); setSelectedTime(''); }} 
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 text-xs md:text-sm font-bold transition-all ${selectedTrainer === t.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-white bg-white hover:border-gray-200'}`}
                >
                  {t.first_name} {t.last_name}
                </button>
              ))}
            </div>
          </section>

          {/* 2. VÝBĚR DNE */}
          <section>
            <div className="flex sm:items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon size={14} /> 2. Výběr dnu
              </h2>
            </div>
            
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
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

          {/* 3. DOSTUPNÁ OKNA */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={14} /> 3. Dostupná okna
            </h2>
            
            {isSelectedDateToday && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs flex items-center gap-2 shadow-sm">
                <Info size={14} className="shrink-0" /> 
                <span><strong>Prohlížíte dnešní den:</strong> Online rezervace je třeba dělat minimálně den předem. Pro dnešní termín kontaktujte přímo trenéra.</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {timeSlotsWithStatus.map((s) => {
                const isSelected = selectedTime === s.time;
                const showAsAvailable = !s.isUnavailable;

                const displayEndTime = userHasPreviousReservations 
                  ? calculateEndTime(s.time) 
                  : calculateFirstLessonEndTime(s.time);

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
                      {s.time} – {displayEndTime}
                    </div>
                    
                    {selectedTrainer === 'Jakýkoliv trenér' && showAsAvailable && (
                      <div className={`text-[8px] md:text-[9px] uppercase tracking-tighter truncate font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-600'}`}>
                        {s.availableTrainers
                          .map(t => `${t.first_name || ''} ${t.last_name || ''}`.trim())
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}

                    {selectedTrainer !== 'Jakýkoliv trenér' && showAsAvailable && !isSelectedDateToday && (
                      <div className={`text-[8px] md:text-[9px] uppercase font-extrabold tracking-wider ${isSelected ? 'text-emerald-100' : 'text-emerald-600'}`}>
                        Volno
                      </div>
                    )}
                    
                    {!showAsAvailable && (
                      <div className="text-[8px] md:text-[9px] uppercase text-gray-400 font-bold">Obsazeno</div>
                    )}
                    {showAsAvailable && isSelectedDateToday && (
                      <div className="text-[8px] md:text-[9px] uppercase text-amber-600 font-bold">Nelze objednat</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* POTVRZOVACÍ TLAČÍTKO */}
          <button 
            onClick={() => handleBooking()}
            disabled={!selectedTime || submitting || intentToBookTodayOrPast || hasNoCredits} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold py-4 md:py-5 text-sm md:text-base rounded-2xl md:rounded-3xl transition-all shadow-xl shadow-emerald-100 enabled:hover:scale-[1.01] enabled:active:scale-[0.99]"
          >
            {hasNoCredits 
              ? 'Nemáte dostatek kreditů'
              : intentToBookTodayOrPast && selectedTime
                ? 'Dnešní termíny nelze rezervovat' 
                : submitting 
                  ? 'Zpracovávám...' 
                  : selectedTrainer === 'Jakýkoliv trenér'
                    ? 'Odeslat žádost volným trenérům (-1 kredit)'
                    : 'Potvrdit trénink (-1 kredit)'}
          </button>
        </div>
      </main>
    </div>
  );
}