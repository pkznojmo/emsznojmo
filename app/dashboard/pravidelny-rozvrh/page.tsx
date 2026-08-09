'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { Clock, Check, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]; 
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

export default function RegularSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [regularHours, setRegularHours] = useState<any[]>([]);

  const fetchData = async (id: string) => {
    const { data: reg, error } = await supabase
      .from('trainer_availability')
      .select('*')
      .eq('trainer_id', id);
    
    if (error) {
      console.error('Chyba při načítání rozvrhu:', error.message);
    } else if (reg) {
      setRegularHours(reg);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkTrainer = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/prihlaseni');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'TRAINER') {
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

  const handleRegularClick = async (dayOfWeek: number, slotTime: string) => {
    if (!trainerId) return;

    // Najdeme, zda už konkrétní slot existuje v databázi
    const existingSlot = regularHours.find(
      r => r.day_of_week === dayOfWeek && r.start_time === slotTime
    );

    if (existingSlot) {
      // Mazání přímo přes primární klíč ID
      const { error } = await supabase
        .from('trainer_availability')
        .delete()
        .eq('id', existingSlot.id);

      if (error) {
        console.error('Chyba při mazání slotu:', error.message);
        alert(`Nepodařilo se smazat: ${error.message}`);
      }
    } else {
      // Vložení nového slotu
      const { error } = await supabase
        .from('trainer_availability')
        .insert([{
          trainer_id: trainerId,
          day_of_week: dayOfWeek,
          start_time: slotTime,
          end_time: getEndTime(slotTime)
        }]);

      if (error) {
        console.error('Chyba při ukládání slotu:', error.message);
        alert(`Nepodařilo se uložit: ${error.message}`);
      }
    }

    // Obnovit data ze serveru
    await fetchData(trainerId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl space-y-8 overflow-x-hidden">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Dlouhodobá šablona rozvrhu ⚙️</h1>
          <p className="text-gray-500 mt-1">
            Klikáním do mřížky si nastav své fixní pracovní hodiny, které se opakují každý týden.
          </p>
        </header>

        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 text-sm text-emerald-800">
            <Info size={20} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <span className="font-bold">Jak to funguje:</span> Zelené sloty znamenají, že jste v tyto časy standardně dostupný/á pro klienty. Kliknutím na políčko čas zapnete nebo vypnete. Změny se okamžitě ukládají.
            </div>
          </div>

          <div className="flex gap-4 text-xs font-bold text-gray-500 px-1">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500" /> Standardně pracuji</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200" /> Volno / Nedostupno</div>
          </div>

          <div className="overflow-x-auto min-w-full pt-2">
            <div className="inline-block min-w-[900px] w-full">
              
              <div className="flex items-center mb-1 text-[10px] font-bold text-gray-400 text-center">
                <div className="w-28 shrink-0 text-left pl-2">Den v týdnu</div>
                <div className="flex-1 flex">
                  {GENERATED_SLOTS.map((slot, idx) => (
                    <div key={slot} className="flex-1 text-[10px]">
                      {idx % 2 === 0 ? slot.split(':')[0] : ''}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {DAYS_ORDER.map(dayNum => (
                  <div key={dayNum} className="flex items-center group">
                    <div className="w-28 shrink-0 font-bold text-sm text-gray-600 group-hover:text-gray-900 transition">
                      {DAYS_NAMES[dayNum]}
                    </div>
                    
                    <div className="flex-1 flex h-12 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                      {GENERATED_SLOTS.map(slot => {
                        const isWorking = regularHours.some(
                          r => r.day_of_week === dayNum && r.start_time === slot
                        );

                        return (
                          <div
                            key={slot}
                            onClick={() => handleRegularClick(dayNum, slot)}
                            className={`flex-1 cursor-pointer border-r border-gray-200/40 last:border-0 transition-all flex flex-col items-center justify-center text-[8px] font-medium select-none ${
                              isWorking 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                : 'bg-gray-100 hover:bg-emerald-100 text-transparent hover:text-emerald-700'
                            }`}
                            title={`${DAYS_NAMES[dayNum]} ${slot} – ${getEndTime(slot)}`}
                          >
                            <span>{slot.split(':')[1] === '00' ? '•' : ''}</span>
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