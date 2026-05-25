'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { Calendar, Clock, UserCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';


interface Reservation {
  id: string;
  date: string;
  time: string;
  trainer: string;
  status: string;
}

export default function ReservationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const fetchReservations = async (userId: string) => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (!error && data) {
      setReservations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkUserAndFetch = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/prihlaseni');
        return;
      }
      await fetchReservations(authUser.id);
    };
    checkUserAndFetch();
  }, [router]);

  const handleCancelReservation = async (id: string) => {
    const confirmCancel = confirm('Opravdu chceš zrušit tento termín tréninku?');
    if (!confirmCancel) return;

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (!error) {
      // Odstraníme zrušenou rezervaci ze stavu na frontendu bez nutnosti reloadu
      setReservations(reservations.filter(res => res.id !== id));
    } else {
      alert('Chyba při rušení lekce: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/prihlaseni');
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
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moje Rezervace</h1>
            <p className="text-gray-500 mt-1">Správa tvých EMS tréninků a plánovaných lekcí.</p>
          </div>
          <Link
            href="/dashboard/nova-lekce"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl transition shadow-sm text-sm shrink-0"
          >
            <Plus size={16} /> Rezervovat nový termín
          </Link>
        </header>

        {/* STAV PERMANENTKY */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Stav kreditu / permanentky</div>
            <div className="text-lg font-bold text-gray-900">Zbývá: <span className="text-emerald-600">{8 - reservations.length} lekcí</span></div>
          </div>
        </div>

        {/* SEZNAM REZERVACÍ */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Nadcházející tréninky</h2>
        
        {reservations.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-gray-500">
            <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="font-medium">Aktuálně nemáš naplánovaný žádný trénink.</p>
            <p className="text-sm text-gray-400 mt-1">Vyber si termín a začni makat!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <div 
                key={res.id} 
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-emerald-200 transition"
              >
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* Datum */}
                  <div className="flex items-center gap-2 text-gray-700 font-semibold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <Calendar size={16} className="text-emerald-600" />
                    {new Date(res.date).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                  </div>

                  {/* Čas */}
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <Clock size={16} className="text-gray-400" />
                    <span>{res.time} <span className="text-xs text-gray-400">(20 min trénink)</span></span>
                  </div>

                  {/* Trenér */}
                  <div className="text-sm text-gray-600">
                    Trenér: <span className="font-semibold text-gray-900">{res.trainer}</span>
                  </div>
                </div>

                {/* Akce */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    Potvrzeno
                  </span>
                  <button 
                    onClick={() => handleCancelReservation(res.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Zrušit lekci
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}