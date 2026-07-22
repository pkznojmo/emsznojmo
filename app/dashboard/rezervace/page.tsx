'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { Calendar, Clock, UserCheck, AlertCircle, Plus, Trash2, Lock, History, Pen } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

interface Reservation {
  id: string;
  date: string;
  time: string;
  trainer: string;
  status: string;
  notes?: string;
}

// Pomocná funkce pro bezpečné převedení YYYY-MM-DD a HH:MM na Date objekt bez UTC/timezone posunu
function parseReservationDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0);
}

export default function ReservationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Logika rozdělení tréninků
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    return reservations.reduce(
      (acc, res) => {
        const resDate = parseReservationDateTime(res.date, res.time);
        if (resDate >= now) {
          acc.upcoming.push(res);
        } else {
          acc.past.push(res);
        }
        return acc;
      },
      { upcoming: [] as Reservation[], past: [] as Reservation[] }
    );
  }, [reservations]);

  const handleCancelReservation = async (id: string) => {
    const res = reservations.find((r) => r.id === id);
    if (res) {
      const resDate = parseReservationDateTime(res.date, res.time).getTime();
      const now = Date.now();
      const hoursRemaining = (resDate - now) / (1000 * 60 * 60);

      if (hoursRemaining < 24) {
        alert('Tento trénink již nelze zrušit. Rezervaci je možné stornovat nejpozději 24 hodin před jejím začátkem.');
        return;
      }
    }

    const confirmCancel = confirm('Opravdu chceš zrušit tento termín tréninku?');
    if (!confirmCancel) return;

    setDeletingId(id);
    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (!error) {
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert('Chyba při rušení lekce: ' + error.message);
    }
    setDeletingId(null);
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
      <Sidebar onLogout={() => supabase.auth.signOut().then(() => router.push('/prihlaseni'))} />

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Moje Rezervace</h1>
            <p className="text-gray-500 mt-2 text-lg">Přehled tvé cesty za lepší kondicí.</p>
          </div>
          <Link
            href="/dashboard/nova-lekce"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} /> Rezervovat trénink
          </Link>
        </header>

        <section className="space-y-12">
          {/* NADCHÁZEJÍCÍ TRÉNINKY */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Calendar size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Nadcházející tréninky</h2>
            </div>

            {upcoming.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-gray-200 text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Momentálně nemáš nic naplánováno.</p>
                <Link href="/dashboard/nova-lekce" className="text-emerald-600 font-bold mt-2 inline-block hover:underline">
                  Naplánuj si svůj první EMS trénink →
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {upcoming.map((res) => (
                  <ReservationCard
                    key={res.id}
                    res={res}
                    isPast={false}
                    isDeleting={deletingId === res.id}
                    onCancel={handleCancelReservation}
                  />
                ))}
              </div>
            )}
          </div>

          {/* HISTORIE TRÉNINKŮ */}
          {past.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-200 text-gray-600 rounded-lg">
                  <History size={20} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Proběhlé tréninky</h2>
              </div>
              <div className="grid gap-4 opacity-75 hover:opacity-100 transition-opacity">
                {past.slice(0, 5).map((res) => (
                  <ReservationCard key={res.id} res={res} isPast={true} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Podkomponenta pro kartu rezervace
function ReservationCard({
  res,
  isPast,
  isDeleting,
  onCancel,
}: {
  res: Reservation;
  isPast: boolean;
  isDeleting?: boolean;
  onCancel?: (id: string) => void;
}) {
  const dateObj = useMemo(() => parseReservationDateTime(res.date, res.time), [res.date, res.time]);

  // Výpočet, zda zbývá méně než 24 hodin do začátku tréninku
  const isLocked = useMemo(() => {
    if (isPast) return false;
    const resDate = dateObj.getTime();
    const now = Date.now();
    const hoursRemaining = (resDate - now) / (1000 * 60 * 60);
    return hoursRemaining < 24;
  }, [dateObj, isPast]);

  return (
    <div className={`bg-white p-6 rounded-2xl border ${isPast ? 'border-gray-200 bg-gray-50/50' : 'border-gray-200 shadow-sm hover:border-emerald-200'} transition-all`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          {/* Datum a čas */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-sm font-bold ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>
              <span>{dateObj.getDate()}</span>
              <span className="uppercase text-[10px]">{dateObj.toLocaleDateString('cs-CZ', { month: 'short' })}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Clock size={16} className="text-gray-400" />
                {res.time}
              </div>
              <div className="text-sm text-gray-500">20 min EMS trénink</div>
            </div>
          </div>

          {/* Trenér */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
              <UserCheck size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Trenér</p>
              <p className="text-sm font-semibold text-gray-800">{res.trainer}</p>
            </div>
          </div>

          {/* Poznámka */}
          {res.notes && (
            <div className="flex items-start gap-2 max-w-xs bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
              <Pen size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs italic text-amber-800 line-clamp-2">{res.notes}</p>
            </div>
          )}
        </div>

        {/* Akce / Status */}
        <div className="flex items-center justify-end gap-3 border-t lg:border-t-0 pt-4 lg:pt-0">
          {isPast ? (
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg">
              Dokončeno
            </span>
          ) : (
            <>
              <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-emerald-100">
                Potvrzeno
              </span>
              {isLocked ? (
                <div
                  className="p-2.5 text-gray-400 bg-gray-50 border border-gray-200/60 rounded-xl cursor-not-allowed select-none"
                  title="Lekci již nelze zrušit (méně než 24h do začátku)"
                >
                  <Lock size={20} className="text-gray-400" />
                </div>
              ) : (
                <button
                  disabled={isDeleting}
                  onClick={() => onCancel?.(res.id)}
                  className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-xl transition-colors"
                  title="Zrušit lekci"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}