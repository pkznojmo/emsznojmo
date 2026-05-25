'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface DbTrainer {
  id: string;
  first_name: string;
  last_name: string;
}

interface TrainerAvailability {
  trainer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface TrainerException {
  trainer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'AVAILABLE' | 'UNAVAILABLE';
}

interface ExistingReservation {
  trainer_id: string;
  date: string;
  time: string;
}

const getUpcomingDays = () => {
  const days = [];
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'numeric' };
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      isoString: d.toISOString().split('T')[0],
      formatted: d.toLocaleDateString('cs-CZ', options),
      dayOfWeek: d.getDay()
    });
  }
  return days;
};

const ALL_TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 7; hour <= 18; hour++) {
    const hStr = hour.toString().padStart(2, '0');
    slots.push(`${hStr}:00`);
    slots.push(`${hStr}:30`);
  }
  return slots;
})();

export default function NewLessonPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [userId, setUserId] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<DbTrainer[]>([]);
  const [availabilities, setAvailabilities] = useState<TrainerAvailability[]>([]);
  const [exceptions, setExceptions] = useState<TrainerException[]>([]);
  const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([]);
  
  const [selectedTrainer, setSelectedTrainer] = useState('Jakýkoliv trenér');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    const initializePage = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/prihlaseni'); return; }
      setUserId(authUser.id);

      const [t, a, e, r] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name').eq('role', 'TRAINER'),
        supabase.from('trainer_availability').select('*'),
        supabase.from('trainer_exceptions').select('*'),
        supabase.from('reservations').select('trainer_id, date, time').eq('status', 'CONFIRMED')
      ]);

      if (t.data) setTrainers(t.data);
      if (a.data) setAvailabilities(a.data);
      if (e.data) setExceptions(e.data);
      if (r.data) setExistingReservations(r.data);
      
      const days = getUpcomingDays();
      if (days.length > 0) setSelectedDate(days[0].isoString);
    };
    initializePage();
  }, [router]);

  const isTimeBetween = (time: string, start: string, end: string) => time >= start && time < end;

  const timeSlotsWithStatus = useMemo(() => {
    if (!selectedDate) return [];
    const dayInfo = getUpcomingDays().find(d => d.isoString === selectedDate);
    if (!dayInfo) return [];

    return ALL_TIME_SLOTS.map(slot => {
      const workingTrainers = trainers.filter(t => {
        // 1. Standardní dostupnost
        const hasAvailability = availabilities.some(a => 
          a.trainer_id === t.id && 
          a.day_of_week === dayInfo.dayOfWeek && 
          isTimeBetween(slot, a.start_time, a.end_time)
        );

        // 2. Extra hodina (výjimka typu AVAILABLE)
        const hasExtraAvailability = exceptions.some(e => 
          e.trainer_id === t.id && 
          e.date === selectedDate && 
          e.type === 'AVAILABLE' && 
          isTimeBetween(slot, e.start_time, e.end_time)
        );

        // 3. Blokace (výjimka typu UNAVAILABLE)
        const isUnavailable = exceptions.some(e => 
          e.trainer_id === t.id && 
          e.date === selectedDate && 
          e.type === 'UNAVAILABLE' && 
          isTimeBetween(slot, e.start_time, e.end_time)
        );

        // Trenér pracuje, pokud má standardní čas nebo extra hodinu, a zároveň není zablokován
        return (hasAvailability || hasExtraAvailability) && !isUnavailable;
      });

      const targetTrainers = selectedTrainer === 'Jakýkoliv trenér' 
        ? workingTrainers 
        : workingTrainers.filter(t => t.id === selectedTrainer);

      const isBooked = targetTrainers.length > 0 && targetTrainers.every(t => 
        existingReservations.some(r => r.trainer_id === t.id && r.date === selectedDate && r.time === slot)
      );

      return { time: slot, isBooked, isWorking: targetTrainers.length > 0 };
    });
  }, [selectedDate, selectedTrainer, trainers, availabilities, exceptions, existingReservations]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) return;
    setSubmitting(true);
    setError('');

    let targetTrainerId = selectedTrainer;
    let trainerFullName = 'Automaticky přiřazen';

    if (selectedTrainer === 'Jakýkoliv trenér') {
      const found = trainers.find(t => {
        const isAvailable = availabilities.some(a => a.trainer_id === t.id && isTimeBetween(selectedTime, a.start_time, a.end_time)) ||
                            exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'AVAILABLE' && isTimeBetween(selectedTime, e.start_time, e.end_time));
        const isBooked = existingReservations.some(r => r.trainer_id === t.id && r.date === selectedDate && r.time === selectedTime);
        const isUnavailable = exceptions.some(e => e.trainer_id === t.id && e.date === selectedDate && e.type === 'UNAVAILABLE' && isTimeBetween(selectedTime, e.start_time, e.end_time));
        
        return isAvailable && !isBooked && !isUnavailable;
      });
      if (!found) {
        setError('Bohužel v tento čas není žádný trenér volný.');
        setSubmitting(false); return;
      }
      targetTrainerId = found.id;
      trainerFullName = `${found.first_name} ${found.last_name}`;
    } else {
      const t = trainers.find(t => t.id === selectedTrainer);
      if (t) trainerFullName = `${t.first_name} ${t.last_name}`;
    }

    const { error: dbError } = await supabase.from('reservations').insert([{
      user_id: userId, date: selectedDate, time: selectedTime, trainer: trainerFullName, trainer_id: targetTrainerId, status: 'CONFIRMED'
    }]);

    if (dbError) { setError('Chyba: ' + dbError.message); } 
    else { alert('Rezervace úspěšně vytvořena!'); router.push('/moje-rezervace'); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />
      <main className="flex-1 p-6 md:p-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Nová lekce 🗓️</h1>
        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>}
        <form onSubmit={handleBooking} className="space-y-8">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-3"><User size={16} className="inline mr-2" /> 1. Výběr trenéra</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div onClick={() => setSelectedTrainer('Jakýkoliv trenér')} className={`p-4 rounded-xl border-2 cursor-pointer ${selectedTrainer === 'Jakýkoliv trenér' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}>Jakýkoliv trenér</div>
              {trainers.map(t => (
                <div key={t.id} onClick={() => setSelectedTrainer(t.id)} className={`p-4 rounded-xl border-2 cursor-pointer ${selectedTrainer === t.id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}>{t.first_name} {t.last_name}</div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-3"><CalendarIcon size={16} className="inline mr-2" /> 2. Výběr dne</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {getUpcomingDays().map((d) => (
                <div key={d.isoString} onClick={() => setSelectedDate(d.isoString)} className={`px-5 py-3 rounded-xl border-2 cursor-pointer ${selectedDate === d.isoString ? 'bg-emerald-600 text-white' : 'bg-white'}`}>{d.formatted}</div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-3"><Clock size={16} className="inline mr-2" /> 3. Čas tréninku</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {timeSlotsWithStatus.map((s) => {
                const isBlocked = s.isBooked || !s.isWorking;
                return (
                  <div key={s.time} onClick={() => !isBlocked && setSelectedTime(s.time)} className={`p-3 rounded-xl border-2 text-center text-sm font-bold transition ${isBlocked ? 'bg-red-50 text-red-400 border-red-100 cursor-not-allowed' : selectedTime === s.time ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-200 cursor-pointer'}`}>
                    {s.time}
                  </div>
                );
              })}
            </div>
          </div>
          <button type="submit" disabled={!selectedTime || submitting} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl">{submitting ? 'Rezervuji...' : 'Potvrdit rezervaci'}</button>
        </form>
      </main>
    </div>
  );
}