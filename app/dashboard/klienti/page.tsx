'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { StepForward, StepBack, Clock, UserPlus, History, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const DAYS_NAMES: { [key: number]: string } = {
  1: 'Pondělí', 2: 'Úterý', 3: 'Středa', 4: 'Čtvrtek', 5: 'Pátek', 6: 'Sobota', 0: 'Neděle'
};

const formatCzechDate = (dateString: string | null) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }).replace(/\s+/g, '');
};

const calculateAge = (birthDateString: string | null) => {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
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

const getWeekDays = (weekOffset = 0) => {
  const days = [];
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'numeric' };
  
  const today = new Date();
  
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayISO = `${yyyy}-${mm}-${dd}`;
  
  const currentDay = today.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() + distanceToMonday + (weekOffset * 7));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime());
    d.setDate(d.getDate() + i);
    
    const dY = d.getFullYear();
    const dM = String(d.getMonth() + 1).padStart(2, '0');
    const dD = String(d.getDate()).padStart(2, '0');
    const isoString = `${dY}-${dM}-${dD}`;
    
    days.push({
      isoString,
      formatted: d.toLocaleDateString('cs-CZ', options),
      dayOfWeek: d.getDay(),
      isToday: isoString === todayISO
    });
  }
  return days;
};

export default function TrainerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trainerProfile, setTrainerProfile] = useState<any>(null);
  
  // Stavy pro data
  const [bookings, setBookings] = useState<any[]>([]);
  const [unassignedBookings, setUnassignedBookings] = useState<any[]>([]);
  const [allTrainers, setAllTrainers] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [globalClientsStats, setGlobalClientsStats] = useState<{ [key: string]: any }>({});
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const fetchData = async (profile: any) => {
    setLoading(true);
    try {
      // 1. Trenéři
      const { data: trainersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'TRAINER');
      if (trainersData) setAllTrainers(trainersData);

      // 2. Pravidelná dostupnost trenérů
      const { data: availData } = await supabase
        .from('trainer_availability')
        .select('*');
      if (availData) setAvailabilities(availData);

      // 3. Výjimky v dostupnosti
      const { data: excData } = await supabase
        .from('trainer_exceptions')
        .select('*');
      if (excData) setExceptions(excData);

      // 4. Rezervace pro statistiky
      const { data: allReservations } = await supabase
        .from('reservations')
        .select('date, user_id, status, profiles:user_id(first_name, last_name, birth_date)');

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const statsMap: { [key: string]: any } = {};
      allReservations?.forEach((res: any) => {
        if (!res.user_id) return;
        if (!statsMap[res.user_id]) {
          const clientName = res.profiles?.first_name || res.profiles?.last_name
            ? `${res.profiles.first_name || ''} ${res.profiles.last_name || ''}`.trim()
            : 'Nový klient';
          
          statsMap[res.user_id] = {
            full_name: clientName,
            age: calculateAge(res.profiles?.birth_date),
            completed_trainings: 0
          };
        }
        
        if (res.status === 'CONFIRMED' && res.date && res.date < todayStr) {
          statsMap[res.user_id].completed_trainings += 1;
        }
      });
      setGlobalClientsStats(statsMap);

      // 5. Moje rezervace
      const { data: myBks } = await supabase
        .from('reservations')
        .select('*, profiles:user_id(first_name, last_name, birth_date)')
        .eq('trainer_id', profile.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      setBookings(myBks || []);

      // 6. Volné rezervace bez trenéra
      const { data: freeBks } = await supabase
        .from('reservations')
        .select('*, profiles:user_id(first_name, last_name, birth_date)')
        .is('trainer_id', null)
        .in('status', ['PENDING', 'CONFIRMED'])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      setUnassignedBookings(freeBks || []);

    } catch (e) {
      console.error("Neočekávaná chyba dat:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/prihlaseni');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'TRAINER') return router.push('/dashboard');
      
      setTrainerProfile(profile);
      fetchData(profile);
    };
    init();
  }, [router]);

  // POMOCNÁ FUNKCE: Zjistí, kteří trenéři jsou reálně dostupní pro dané datum a čas
  const getAvailableTrainersForSlot = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return [];

    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay(); // 0 = Neděle, 1 = Pondělí, ...
    const cleanTime = timeStr.split('-')[0].trim(); // Převede "14:00 - 14:45" na "14:00"

    return allTrainers.filter(trainer => {
      // a) Kontrola výjimek (UNAVAILABLE ruší dostupnost, AVAILABLE ji vynucuje)
      const hasUnavailableExc = exceptions.some(exc => 
        exc.trainer_id === trainer.id && 
        exc.date === dateStr && 
        exc.start_time <= cleanTime && 
        exc.end_time > cleanTime && 
        exc.type === 'UNAVAILABLE'
      );
      if (hasUnavailableExc) return false;

      const hasAvailableExc = exceptions.some(exc => 
        exc.trainer_id === trainer.id && 
        exc.date === dateStr && 
        exc.start_time <= cleanTime && 
        exc.end_time > cleanTime && 
        exc.type === 'AVAILABLE'
      );
      if (hasAvailableExc) return true;

      // b) Kontrola běžného rozvrhu (trainer_availability)
      const hasRegularAvail = availabilities.some(avail => 
        avail.trainer_id === trainer.id && 
        avail.day_of_week === dayOfWeek && 
        avail.start_time <= cleanTime && 
        avail.end_time > cleanTime
      );

      return hasRegularAvail;
    });
  };

  const handleClaimBooking = async (bookingId: string) => {
    if (!trainerProfile) return;
    const trainerName = `${trainerProfile.first_name} ${trainerProfile.last_name}`;
    
    const { error } = await supabase
      .from('reservations')
      .update({ 
        trainer_id: trainerProfile.id,
        trainer: trainerName,
        status: 'CONFIRMED'
      })
      .eq('id', bookingId);

    if (!error) {
      alert('Trénink byl úspěšně přiřazen vám!');
      fetchData(trainerProfile);
    } else {
      alert('Chyba při přebírání lekce: ' + error.message);
    }
  };

  const { upcomingTrainings, pastTrainings } = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const upcoming: any[] = [];
    const past: any[] = [];

    bookings.forEach((b) => {
      const clientStats = globalClientsStats[b.user_id] || {
        full_name: b.profiles?.first_name || b.profiles?.last_name 
          ? `${b.profiles.first_name || ''} ${b.profiles.last_name || ''}`.trim() 
          : 'Nový klient',
        age: calculateAge(b.profiles?.birth_date),
        completed_trainings: 0
      };

      const enrichedTraining = {
        ...b,
        client_name: clientStats.full_name,
        client_age: clientStats.age,
        completed_trainings: clientStats.completed_trainings
      };

      if (b.date >= todayStr) {
        upcoming.push(enrichedTraining);
      } else {
        past.unshift(enrichedTraining);
      }
    });

    return { upcomingTrainings: upcoming, pastTrainings: past };
  }, [bookings, globalClientsStats]);

  const matrix = useMemo(() => {
    return currentWeekDays.map(day => {
      const slots = GENERATED_SLOTS.map(slot => {
        const myBooking = bookings.find(b => b.date?.trim() === day.isoString && b.time?.trim().startsWith(slot));
        const freeBooking = unassignedBookings.find(b => b.date?.trim() === day.isoString && b.time?.trim().startsWith(slot));
        return { time: slot, myBooking, freeBooking };
      });
      return { ...day, slots };
    });
  }, [currentWeekDays, bookings, unassignedBookings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      <Sidebar onLogout={() => supabase.auth.signOut().then(() => router.push('/prihlaseni'))} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl space-y-8 overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trenérský Portál 📅</h1>
            <p className="text-gray-500 mt-1">Vítejte zpět, {trainerProfile?.first_name || 'trenére'}. Zde je správa vašich lekcí.</p>
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

        {/* SEKCE 1: TÝDENNÍ ČASOVÁ OSA */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 px-1">
            <h2 className="font-bold flex items-center gap-2 text-gray-900">
              <Clock className="text-indigo-600" size={20}/> Týdenní časová osa
            </h2>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500" /> Moje lekce</div>
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-orange-400" /> Čekají na trenéra</div>
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200" /> Volno</div>
            </div>
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
                {matrix.map(day => (
                  <div key={day.isoString} className="flex items-center group">
                    <div className="w-36 shrink-0 text-sm flex flex-col justify-center leading-tight">
                      <span className="font-extrabold text-gray-800">{day.formatted}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${day.isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {day.isToday ? 'Dnes' : DAYS_NAMES[day.dayOfWeek]}
                      </span>
                    </div>

                    <div className="flex-1 flex h-12 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                      {day.slots.map((slot, idx) => {
                        const isMine = !!slot.myBooking;
                        const isFree = !!slot.freeBooking;

                        let bgClass = 'bg-gray-100 hover:bg-gray-200/70';
                        if (isMine) bgClass = 'bg-emerald-500 border-emerald-600/20 shadow-inner';
                        if (isFree) bgClass = 'bg-orange-400 border-orange-500/20 shadow-inner';

                        return (
                          <div
                            key={idx}
                            className={`flex-1 border-r border-gray-200/40 last:border-0 transition-all flex flex-col items-center justify-center select-none ${bgClass}`}
                            title={`${day.formatted} v ${slot.time} – ${
                              isMine ? 'Váš trénink' : isFree ? 'Lekce čeká na trenéra' : 'Volno'
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

        {/* TŘÍSLOUPCOVÝ LAYOUT TRÉNINKŮ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SLOUPEC 1: NEJBLIŽŠÍ TRÉNINKY */}
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <CheckCircle2 className="text-emerald-500" size={20}/> Nejbližší tréninky
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
              {upcomingTrainings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-xl">Žádné naplánované tréninky.</div>
              ) : (
                upcomingTrainings.map((tr: any) => (
                  <div key={tr.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200/60 space-y-2.5 hover:shadow-sm transition">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-bold text-gray-800 text-base leading-tight">{tr.client_name}</div>
                      <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg shrink-0 border border-indigo-100/70">{formatCzechDate(tr.date)} – {tr.time}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>Věk: <strong className="text-gray-700">{tr.client_age !== null ? tr.client_age : '-'}</strong></span>
                      <span>Absolvované lekce: <strong className="text-emerald-600 font-bold">{tr.completed_trainings}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* SLOUPEC 2: PROBĚHLÉ TRÉNINKY */}
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <History className="text-blue-500" size={20}/> Proběhlé tréninky
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
              {pastTrainings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-xl">Žádná historie tréninků.</div>
              ) : (
                pastTrainings.map((tr: any) => (
                  <div key={tr.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200/60 space-y-2.5 hover:shadow-sm transition">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-bold text-gray-800 text-base leading-tight">{tr.client_name}</div>
                      <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg shrink-0 border border-gray-200">{formatCzechDate(tr.date)} – {tr.time}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>Věk: <strong className="text-gray-700">{tr.client_age !== null ? tr.client_age : '-'}</strong></span>
                      <span>Absolvované lekce: <strong className="text-blue-600 font-bold">{tr.completed_trainings}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* SLOUPEC 3: KLIENTI ČEKAJÍCÍ NA TRENÉRA */}
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserPlus className="text-orange-500" size={20}/> Čekající na trenéra
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
              {unassignedBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-xl">Žádné lekce nečekají na převzetí.</div>
              ) : (
                unassignedBookings.map((b: any) => {
                  const isAnyTrainerRequest = b.trainer?.toLowerCase().includes('jakýkoliv') || b.trainer?.toLowerCase().includes('jakykoliv');
                  
                  // Dynamický výpočet dostupných trenérů pro konkrétní termín rezervace
                  const availableTrainers = getAvailableTrainersForSlot(b.date, b.time);
                  const availableTrainersString = availableTrainers.length > 0
                    ? availableTrainers.map(t => `${t.first_name || ''} ${t.last_name || ''}`.trim()).join(', ')
                    : 'Žádný trenér nemá volno';

                  const displayTrainerInfo = isAnyTrainerRequest 
                    ? `Dostupní trenéři: ${availableTrainersString}` 
                    : `Požadavek: ${b.trainer || 'Jakýkoliv trenér'}`;

                  const clientFullName = b.profiles?.first_name || b.profiles?.last_name
                    ? `${b.profiles.first_name || ''} ${b.profiles.last_name || ''}`.trim()
                    : 'Nový klient';

                  const stats = globalClientsStats[b.user_id] || { age: null, completed_trainings: 0 };

                  return (
                    <div key={b.id} className="p-4 bg-white rounded-xl border border-orange-100 shadow-sm space-y-3 flex flex-col justify-between hover:border-orange-200 transition">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-bold text-gray-800 text-base leading-tight">{clientFullName}</div>
                          <span className="text-[11px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg shrink-0 border border-orange-100">{formatCzechDate(b.date)} – {b.time}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500 font-semibold">
                          <span>Věk: <strong className="text-gray-700">{calculateAge(b.profiles?.birth_date) ?? '-'}</strong></span>
                          <span>Absolvované lekce: <strong className="text-orange-600 font-bold">{stats.completed_trainings}</strong></span>
                        </div>

                        <div className={`text-[11px] p-2 rounded-lg font-semibold border leading-tight ${
                          isAnyTrainerRequest 
                            ? 'text-blue-700 bg-blue-50 border-blue-100/70' 
                            : 'text-orange-600 bg-orange-50 border-orange-100/70'
                        }`}>
                          {displayTrainerInfo}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-50 flex items-center justify-end">
                        <button 
                          onClick={() => handleClaimBooking(b.id)}
                          className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-orange-600 transition shadow-sm shadow-orange-100"
                        >
                          Přiřadit sobě
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}