'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { 
  Calendar as CalendarIcon, 
  Info, 
  StepBack, 
  StepForward, 
  X, 
  Search, 
  User, 
  UserCheck, 
  Clock, 
  CheckCircle2,
  Trash2,
  Lock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string | null;
}

interface Reservation {
  id: string;
  user_id: string;
  trainer_id?: string | null;
  date: string;
  time: string;
  trainer: string;
  status: string;
  client?: ClientProfile | null;
}

interface SelectedSlotInfo {
  dateStr: string;
  formattedDate: string;
  slotTime: string;
  status: 'FREE' | 'OCCUPIED_ME' | 'OCCUPIED_OTHER';
  existingReservation?: Reservation | null;
}

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

export default function WeeklySchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeMobileDayIndex, setActiveMobileDayIndex] = useState<number>(0);

  // Stav pro Modal / Pop-up formulář
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlotInfo | null>(null);
  const [assigneeType, setAssigneeType] = useState<'SELF' | 'CLIENT'>('CLIENT');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientsList, setClientsList] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trainerNote, setTrainerNote] = useState('');

  const currentWeekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const fetchData = async (userId: string) => {
    setLoading(true);
    const startDate = currentWeekDays[0].isoString;
    const endDate = currentWeekDays[6].isoString;

    const { data, error } = await supabase
      .from('reservations')
      .select('*, client:profiles!user_id(id, first_name, last_name, email, phone)')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Chyba při načítání rezervací tělocvičny:', error.message);
    } else if (data) {
      setReservations(data as Reservation[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
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

      setCurrentUserId(user.id);
      fetchData(user.id);
    };

    checkUser();
  }, [router, weekOffset]);

  // Nastavit výchozí mobilní den na "Dnes" pokud je v aktuálním týdnu
  useEffect(() => {
    const todayIndex = currentWeekDays.findIndex(d => d.isToday);
    if (todayIndex !== -1) {
      setActiveMobileDayIndex(todayIndex);
    } else {
      setActiveMobileDayIndex(0);
    }
  }, [currentWeekDays]);

  // Vyhledávání klientů podle first_name a last_name
  useEffect(() => {
    if (assigneeType !== 'CLIENT' || clientSearchQuery.trim().length < 2) {
      setClientsList([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingClients(true);
      const q = clientSearchQuery.trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(6);

      if (error) {
        console.error('Chyba při hledání klientů:', error.message);
      } else {
        setClientsList(data || []);
      }
      setIsSearchingClients(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearchQuery, assigneeType]);

  const getEndTime = (startTime: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const endM = m + 30;
    const endH = endM === 60 ? h + 1 : h;
    const endMStr = endM === 60 ? '00' : '30';
    return `${endH.toString().padStart(2, '0')}:${endMStr}`;
  };

  const openSlotModal = (
    dateStr: string, 
    formattedDate: string,
    slotTime: string, 
    status: 'FREE' | 'OCCUPIED_ME' | 'OCCUPIED_OTHER',
    existingReservation?: Reservation | null
  ) => {
    if (status === 'OCCUPIED_OTHER') return;

    setSelectedSlot({
      dateStr,
      formattedDate,
      slotTime,
      status,
      existingReservation
    });
    setAssigneeType('CLIENT');
    setSelectedClient(null);
    setClientSearchQuery('');
    setTrainerNote(existingReservation?.trainer || 'Trénink');
  };

  const closeModal = () => {
    setSelectedSlot(null);
    setSelectedClient(null);
    setClientSearchQuery('');
    setTrainerNote('');
  };

  const handleSaveBooking = async () => {
    if (!currentUserId || !selectedSlot) return;

    if (assigneeType === 'CLIENT' && !selectedClient) {
      alert('Prosím vyberte klienta ze seznamu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetUserId = assigneeType === 'CLIENT' ? selectedClient!.id : currentUserId;

      const { error } = await supabase
        .from('reservations')
        .insert([{
          user_id: targetUserId,
          trainer_id: currentUserId,
          date: selectedSlot.dateStr,
          time: selectedSlot.slotTime,
          trainer: trainerNote || (assigneeType === 'SELF' ? 'Osobní blokace' : 'Osobní trénink'),
          status: 'CONFIRMED'
        }]);

      if (error) throw error;

      await fetchData(currentUserId);
      closeModal();
    } catch (err: any) {
      console.error('Chyba při ukládání:', err);
      alert(`Chyba při ukládání rezervace: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!currentUserId || !selectedSlot?.existingReservation) return;

    if (!confirm('Opravdu chcete zrušit tuto rezervaci tělocvičny?')) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', selectedSlot.existingReservation.id);

      if (error) throw error;

      await fetchData(currentUserId);
      closeModal();
    } catch (err: any) {
      console.error('Chyba při rušení rezervace:', err);
      alert(`Chyba při rušení rezervace: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.trim().split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculatedDaysMatrix = useMemo(() => {
    return currentWeekDays.map(day => {
      const slots = GENERATED_SLOTS.map(slot => {
        const slotMin = timeToMinutes(slot);

        const foundReservation = reservations.find(r => {
          if (r.date !== day.isoString) return false;

          let startMin: number;
          let endMin: number;

          if (r.time.includes('-')) {
            const [startStr, endStr] = r.time.split('-');
            startMin = timeToMinutes(startStr);
            endMin = timeToMinutes(endStr);
          } else {
            startMin = timeToMinutes(r.time);
            endMin = startMin + 30;
          }

          return slotMin >= startMin && slotMin < endMin;
        });

        let status: 'FREE' | 'OCCUPIED_ME' | 'OCCUPIED_OTHER' = 'FREE';

        if (foundReservation) {
          if (foundReservation.trainer_id === currentUserId || foundReservation.user_id === currentUserId) {
            status = 'OCCUPIED_ME';
          } else {
            status = 'OCCUPIED_OTHER';
          }
        }

        return {
          time: slot,
          status,
          reservation: foundReservation || null
        };
      });

      return { ...day, slots };
    });
  }, [currentWeekDays, reservations, currentUserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedMobileDayData = calculatedDaysMatrix[activeMobileDayIndex] || calculatedDaysMatrix[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-7xl space-y-6 md:space-y-8 overflow-x-hidden">
        {/* HLAVIČKA */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Obsazenost tělocvičny 🏋️‍♂️</h1>
            <p className="text-sm text-gray-500 mt-1">
              Přehled využití tělocvičny na celý týden. Kliknutím na volný čas si zarezervuješ slot.
            </p>
          </div>

          <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 select-none items-center justify-between self-stretch md:self-auto">
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

        {/* LEGENDA */}
        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-wrap gap-4 sm:gap-6 text-xs font-bold text-gray-600 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-slate-200 border border-slate-300" />
              <span>Volno</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-green-500" />
              <span>Obsazeno mnou</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-red-500" />
              <span>Obsazeno jiným trenérem</span>
            </div>
          </div>

          {/* MOBILNÍ ZOBRAZENÍ (< md) */}
          <div className="block md:hidden space-y-4">
            {/* Přepínač dnů (Scrollable Tabs) */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
              {calculatedDaysMatrix.map((day, idx) => {
                const isActive = idx === activeMobileDayIndex;
                return (
                  <button
                    key={day.isoString}
                    onClick={() => setActiveMobileDayIndex(idx)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-center border transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase opacity-80">
                      {day.isToday ? 'Dnes' : DAYS_NAMES[day.dayOfWeek].slice(0, 3)}
                    </div>
                    <div className="text-xs font-black">{day.formatted.split('.')[0]}.{day.formatted.split('.')[1]}</div>
                  </button>
                );
              })}
            </div>

            {/* Vybraný den hlavička */}
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="font-bold text-gray-800 text-sm">
                {selectedMobileDayData.formatted} ({DAYS_NAMES[selectedMobileDayData.dayOfWeek]})
              </div>
              {selectedMobileDayData.isToday && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Dnes
                </span>
              )}
            </div>

            {/* Grid časových slotů na mobilu (2 sloupce) */}
            <div className="grid grid-cols-2 gap-2">
              {selectedMobileDayData.slots.map(slot => {
                let statusBg = 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-gray-700 cursor-pointer';
                let statusLabel = 'Volno';

                if (slot.status === 'OCCUPIED_ME') {
                  statusBg = 'bg-green-500 hover:bg-green-600 border-green-600 text-white cursor-pointer';
                  statusLabel = slot.reservation?.client 
                    ? `${slot.reservation.client.first_name} ${slot.reservation.client.last_name.slice(0, 1)}.`
                    : 'Moje rezervace';
                } else if (slot.status === 'OCCUPIED_OTHER') {
                  statusBg = 'bg-red-500/10 border-red-200 text-red-600 cursor-not-allowed';
                  statusLabel = 'Obsazeno';
                }

                return (
                  <button
                    key={slot.time}
                    disabled={slot.status === 'OCCUPIED_OTHER'}
                    onClick={() => openSlotModal(selectedMobileDayData.isoString, selectedMobileDayData.formatted, slot.time, slot.status, slot.reservation)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition text-left ${statusBg}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{slot.time}</span>
                      <span className="text-[10px] opacity-80 truncate max-w-[100px]">{statusLabel}</span>
                    </div>
                    {slot.status === 'OCCUPIED_OTHER' ? (
                      <Lock size={12} className="opacity-60 shrink-0" />
                    ) : (
                      <Clock size={12} className="opacity-60 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOPOVÉ ZOBRAZENÍ (>= md) */}
          <div className="hidden md:block overflow-x-auto min-w-full pt-2">
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
                        let bgClass = 'bg-slate-200 hover:bg-slate-300 cursor-pointer';
                        let titleText = `${day.formatted} v ${slot.time} – Volno`;

                        if (slot.status === 'OCCUPIED_ME') {
                          bgClass = 'bg-green-500 hover:bg-green-600 cursor-pointer';
                          titleText = `${day.formatted} v ${slot.time} – Obsazeno mnou (Klikni pro detail)`;
                        } else if (slot.status === 'OCCUPIED_OTHER') {
                          bgClass = 'bg-red-500 opacity-90 cursor-not-allowed';
                          titleText = `${day.formatted} v ${slot.time} – Obsazeno (Tělocvična je zabraná)`;
                        }

                        return (
                          <div
                            key={slot.time}
                            onClick={() => openSlotModal(day.isoString, day.formatted, slot.time, slot.status, slot.reservation)}
                            className={`flex-1 border-r border-white/30 last:border-0 transition-all flex flex-col items-center justify-center select-none ${bgClass}`}
                            title={titleText}
                          >
                            <span className="text-[8px] font-medium opacity-30 text-white">
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

      {/* POP-UP / MODAL (Plně optimalizováno pro mobily) */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-5 sm:p-6 space-y-5 sm:space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                <Clock size={14} />
                <span>{selectedSlot.formattedDate} v {selectedSlot.slotTime} ({selectedSlot.slotTime}–{getEndTime(selectedSlot.slotTime)})</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {selectedSlot.status === 'OCCUPIED_ME' ? 'Spravovat moji rezervaci' : 'Rezervovat tělocvičnu'}
              </h2>
            </div>

            {selectedSlot.status === 'OCCUPIED_ME' ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-950 space-y-2 text-sm">
                  <p className="font-bold flex items-center gap-2 text-green-800">
                    <UserCheck size={18} />
                    Rezervováno vámi
                  </p>
                  {selectedSlot.existingReservation?.client ? (
                    <p>
                      Klient: <strong>
                        {selectedSlot.existingReservation.client.first_name} {selectedSlot.existingReservation.client.last_name}
                      </strong>
                    </p>
                  ) : (
                    <p>Typ: <strong>Osobní trénink / Blokace trenéra</strong></p>
                  )}
                  {selectedSlot.existingReservation?.trainer && (
                    <p className="text-xs text-green-700">Detail: {selectedSlot.existingReservation.trainer}</p>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteBooking}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    <span>Zrušit rezervaci</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl text-xs sm:text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setAssigneeType('CLIENT')}
                    className={`py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition ${
                      assigneeType === 'CLIENT' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <User size={16} />
                    <span>Vyhledat klienta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssigneeType('SELF')}
                    className={`py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition ${
                      assigneeType === 'SELF' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <UserCheck size={16} />
                    <span>Zvolit sebe</span>
                  </button>
                </div>

                {assigneeType === 'CLIENT' ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Vyhledat klienta podle jména
                    </label>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        placeholder="Zadejte jméno..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                      {isSearchingClients && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {selectedClient && (
                      <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-indigo-900">
                            {selectedClient.first_name} {selectedClient.last_name}
                          </p>
                          <p className="text-xs text-indigo-600">{selectedClient.email || selectedClient.phone}</p>
                        </div>
                        <CheckCircle2 className="text-indigo-600" size={20} />
                      </div>
                    )}

                    {!selectedClient && clientsList.length > 0 && (
                      <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white shadow-sm">
                        {clientsList.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className="w-full text-left p-2.5 hover:bg-gray-50 transition flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">
                                {client.first_name} {client.last_name}
                              </p>
                              <p className="text-xs text-gray-400">{client.email}</p>
                            </div>
                            <span className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                              Vybrat
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-900 text-sm space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <UserCheck size={18} className="text-green-600" />
                      Osobní trénink / Blokace
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Popis tréninku (sloupec trainer)
                  </label>
                  <input
                    type="text"
                    value={trainerNote}
                    onChange={(e) => setTrainerNote(e.target.value)}
                    placeholder="Např. Osobní trénink..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Zrušit
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSaveBooking}
                    disabled={isSubmitting || (assigneeType === 'CLIENT' && !selectedClient)}
                    className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Ukládám...</span>
                      </>
                    ) : (
                      <span>Zarezervovat tělocvičnu</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}