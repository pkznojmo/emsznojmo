'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../comp/Sidebar'; 
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  Plus, 
  Lock, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  Dumbbell, 
  Sparkles, 
  Droplets, 
  TrendingUp, 
  Key, 
  ShieldCheck,
  AlertCircle,
  Coins,
  CreditCard
} from 'lucide-react';

// --- INTERFACES ---
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  birth_number?: string | null;
  credit_balance?: number;
  address: string | null;
  clothing_size: string;
  goals: string | null;
  customer_note?: string | null;
  role: string;
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  trainer: string;
  trainer_id?: string | null;
  status: string;
  notes?: string;
  user_id?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    birth_date: string | null;
  };
}

// Pomocná funkce pro převod YYYY-MM-DD a HH:MM na Date
function parseReservationDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0);
}

const calculateAge = (birthDateString: string | null | undefined) => {
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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Stavy pro rezervace klientů
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stavy pro trenéra
  const [trainerClients, setTrainerClients] = useState<any[]>([]);
  const [unassignedBookings, setUnassignedBookings] = useState<any[]>([]);
  const [globalClientsStats, setGlobalClientsStats] = useState<{ [key: string]: any }>({});

  // Stavy pro editaci profilu
  const [activeField, setActiveField] = useState<string | null>(null);
  const [editData, setEditData] = useState({ 
    first_name: '', 
    last_name: '', 
    phone: '', 
    address: '',
    birth_number: '',
    goals: '', 
    customer_note: '' 
  });

  // Heslo
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });

  // Načtení dat
  const fetchData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      router.push('/prihlaseni');
      return;
    }

    // 1. Profil uživatele
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setEditData({ 
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '', 
        address: profileData.address || '',
        birth_number: profileData.birth_number || '',
        goals: profileData.goals || '', 
        customer_note: profileData.customer_note || '' 
      });

      // 2. Vlastní rezervace (Pro každého uživatele)
      const { data: myRes } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      setMyReservations(myRes || []);

      // 3. Pokud je TRENÉR, načti trenérská data
      if (profileData.role === 'TRAINER') {
        const { data: trainerRes } = await supabase
          .from('reservations')
          .select('*, profiles:user_id(first_name, last_name, birth_date)')
          .eq('trainer_id', user.id)
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        const { data: freeRes } = await supabase
          .from('reservations')
          .select('*, profiles:user_id(first_name, last_name, birth_date)')
          .is('trainer_id', null)
          .in('status', ['PENDING', 'CONFIRMED'])
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        const { data: allRes } = await supabase
          .from('reservations')
          .select('date, user_id, status');

        const todayStr = new Date().toISOString().split('T')[0];
        const statsMap: { [key: string]: number } = {};
        allRes?.forEach((r) => {
          if (r.user_id && r.status === 'CONFIRMED' && r.date < todayStr) {
            statsMap[r.user_id] = (statsMap[r.user_id] || 0) + 1;
          }
        });

        setGlobalClientsStats(statsMap);
        setTrainerClients(trainerRes || []);
        setUnassignedBookings(freeRes || []);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Neuvedeno';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/prihlaseni');
    router.refresh();
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    setPasswordLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/obnova-hesla`,
    });
    setPasswordMessage(error 
      ? { text: `Chyba: ${error.message}`, isError: true } 
      : { text: 'E-mail pro změnu hesla byl odeslán!', isError: false }
    );
    setPasswordLoading(false);
  };

  const saveFieldRealTime = async (fieldName: keyof typeof editData) => {
    if (!profile) return;

    // Pokud upravujeme rodné číslo a profil ho již měl vyplněné, zamezíme změně
    if (fieldName === 'birth_number' && profile.birth_number) {
      setActiveField(null);
      return;
    }

    setActiveField(null);
    if (profile[fieldName as keyof UserProfile] === editData[fieldName]) return;

    const { error } = await supabase
      .from('profiles')
      .update({ [fieldName]: editData[fieldName] })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, [fieldName]: editData[fieldName] });
    } else {
      setEditData(prev => ({ ...prev, [fieldName]: (profile[fieldName as keyof UserProfile] as string) || '' }));
      alert(`Chyba při ukládání: ${error.message}`);
    }
  };

  // Stornování lekce
  const handleCancelReservation = async (id: string) => {
    const res = myReservations.find((r) => r.id === id);
    if (res) {
      const resDate = parseReservationDateTime(res.date, res.time).getTime();
      const now = Date.now();
      const hoursRemaining = (resDate - now) / (1000 * 60 * 60);

      if (hoursRemaining < 24) {
        alert('Tento trénink již nelze zrušit. Rezervaci je možné stornovat nejpozději 24 hodin před jejím začátkem.');
        return;
      }
    }

    if (!confirm('Opravdu chceš zrušit tento termín tréninku?')) return;

    setDeletingId(id);
    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (!error) {
      setMyReservations((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert('Chyba při rušení lekce: ' + error.message);
    }
    setDeletingId(null);
  };

  // Převzetí lekce trenérem
  const handleClaimBooking = async (bookingId: string) => {
    if (!profile) return;
    const trainerName = `${profile.first_name} ${profile.last_name}`;
    
    const { error } = await supabase
      .from('reservations')
      .update({ 
        trainer_id: profile.id,
        trainer: trainerName,
        status: 'CONFIRMED'
      })
      .eq('id', bookingId);

    if (!error) {
      alert('Lekce byla úspěšně přiřazena k vašemu účtu!');
      fetchData();
    } else {
      alert('Chyba při přebírání lekce: ' + error.message);
    }
  };

  const { upcomingReservations, pastReservations } = useMemo(() => {
    const now = new Date();
    const upcoming: Reservation[] = [];
    const past: Reservation[] = [];

    myReservations.forEach((res) => {
      const resDate = parseReservationDateTime(res.date, res.time);
      if (resDate >= now) upcoming.push(res);
      else past.push(res);
    });

    return { upcomingReservations: upcoming, pastReservations: past };
  }, [myReservations]);

  const upcomingTrainerClients = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return trainerClients.filter(c => c.date >= todayStr);
  }, [trainerClients]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-medium text-sm">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        Načítám klientskou zónu...
      </div>
    );
  }

  const isTrainer = profile?.role === 'TRAINER';

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row text-gray-900">
      {/* Sidebar Component */}
      <Sidebar onLogout={handleLogout} />

      {/* Hlavní obsah */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto overflow-y-auto w-full space-y-8 pb-24 md:pb-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Vítej zpět, {profile?.first_name || 'Uživateli'}! 👋
              </h1>
              {isTrainer ? (
                <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Trenér
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Klient
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1 text-xs md:text-sm">
              {isTrainer 
                ? 'Přehled vašich nadcházejících klientů, lekcí k převzetí a správa účtu.' 
                : 'Máš přehled o všech svých nadcházejících EMS trénincích a rezervačním plánu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link
              href="/dashboard/nova-lekce"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm transition shadow-sm"
            >
              <Plus size={16} /> Rezervovat trénink
            </Link>

            <button
              onClick={handlePasswordReset}
              disabled={passwordLoading}
              className="inline-flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 font-medium px-3.5 py-2.5 rounded-xl transition text-gray-700 disabled:opacity-50"
            >
              <Key size={14} />
              {passwordLoading ? 'Odesílám...' : 'Změnit heslo'}
            </button>
          </div>
        </header>

        {passwordMessage.text && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${passwordMessage.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            <Sparkles size={16} />
            {passwordMessage.text}
          </div>
        )}

        {/* ========================================================================= */}
        {/* HORNÍ SEKCE 1: STATISTIKY A KREDITY */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isTrainer ? (
            <>
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserCheck size={24} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Moji klienti</span>
                  <span className="text-2xl font-black text-gray-800">{upcomingTrainerClients.length} <span className="text-xs font-normal text-gray-500">naplánováno</span></span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <UserPlus size={24} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Čeká na trenéra</span>
                  <span className="text-2xl font-black text-orange-600">{unassignedBookings.length} <span className="text-xs font-normal text-gray-500">volných lekcí</span></span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Dumbbell size={24} />
                </div>
                <div>
                    <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Kreditní zůstatek</span>
                    <span className="text-2xl font-black text-emerald-950">
                      {profile?.credit_balance ?? 0} <span className="text-xs font-semibold text-emerald-700">kreditů</span>
                    </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Karta: Nadcházející tréninky */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Calendar size={24} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Nadcházející tréninky</span>
                  <span className="text-2xl font-black text-gray-800">{upcomingReservations.length} <span className="text-xs font-normal text-gray-500">lekcí</span></span>
                </div>
              </div>

              {/* Karta: Kredity + Tlačítko Dokoupit */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between gap-3 bg-gradient-to-br from-white to-emerald-50/30">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
                    <Coins size={22} />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Kreditní zůstatek</span>
                    <span className="text-2xl font-black text-emerald-950">
                      {profile?.credit_balance ?? 0} <span className="text-xs font-semibold text-emerald-700">kreditů</span>
                    </span>
                  </div>
                </div>

                <Link
                  href="/dashboard/kredity"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Dokoupit
                </Link>
              </div>

              {/* Karta: Absolvované EMS tréninky */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Absolvované tréninky</span>
                  <span className="text-2xl font-black text-blue-600">{pastReservations.length} <span className="text-xs font-normal text-gray-500">dokončeno</span></span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SEKCE 2: HLAVNÍ OPERAČNÍ BLOK (PRO TRENÉRA / PRO KLIENTA) */}
        {/* ========================================================================= */}
        {isTrainer ? (
          /* ------------------- PRO TRENÉRA ------------------- */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <UserCheck className="text-emerald-600" size={20} />
                  Moji nejbližší klienti
                </h2>
                <Link href="/dashboard/klienti" className="text-xs font-bold text-emerald-600 hover:underline">
                  Zobrazit vše →
                </Link>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {upcomingTrainerClients.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                    Zatím nemáte naplánované žádné tréninky s klienty.
                  </div>
                ) : (
                  upcomingTrainerClients.map((tr) => {
                    const clientName = tr.profiles?.first_name || tr.profiles?.last_name
                      ? `${tr.profiles.first_name || ''} ${tr.profiles.last_name || ''}`.trim()
                      : 'Klient bez jména';
                    const age = calculateAge(tr.profiles?.birth_date);
                    const completed = globalClientsStats[tr.user_id] || 0;

                    return (
                      <div key={tr.id} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/60 space-y-2 hover:border-emerald-200 transition">
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-bold text-gray-800 text-sm">{clientName}</div>
                          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-100 shrink-0">
                            {formatDate(tr.date)} v {tr.time}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-medium pt-1">
                          <span>Věk: <strong className="text-gray-700">{age !== null ? `${age} let` : '—'}</strong></span>
                          <span>Odcvičeno lekcí: <strong className="text-emerald-600 font-bold">{completed}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <UserPlus className="text-orange-500" size={20} />
                  Lekce ke převzetí (Bez trenéra)
                </h2>
                <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {unassignedBookings.length}
                </span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {unassignedBookings.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                    Momentálně žádné lekce nečekají na převzetí.
                  </div>
                ) : (
                  unassignedBookings.map((b) => {
                    const clientName = b.profiles?.first_name || b.profiles?.last_name
                      ? `${b.profiles.first_name || ''} ${b.profiles.last_name || ''}`.trim()
                      : 'Nový klient';
                    const age = calculateAge(b.profiles?.birth_date);

                    return (
                      <div key={b.id} className="p-4 bg-orange-50/30 rounded-xl border border-orange-100 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{clientName}</div>
                            <div className="text-[11px] text-gray-500">Věk: {age !== null ? `${age} let` : '—'}</div>
                          </div>
                          <span className="text-[11px] font-bold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-lg border border-orange-200 shrink-0">
                            {formatDate(b.date)} v {b.time}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-orange-100/60">
                          <span className="text-[10px] text-orange-700 font-medium">Požadavek: {b.trainer || 'Jakýkoliv trenér'}</span>
                          <button
                            onClick={() => handleClaimBooking(b.id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-sm"
                          >
                            Přiřadit sobě
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ------------------- PRO BĚŽNÉHO KLIENTA ------------------- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              
              {/* BANNER NEJBLIŽŠÍ LEKCE */}
              {upcomingReservations.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1 relative z-10">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md">
                      Tvoje nejbližší lekce
                    </span>
                    <h3 className="text-2xl font-black pt-1">
                      {formatDate(upcomingReservations[0].date)} v {upcomingReservations[0].time}
                    </h3>
                    <p className="text-xs text-emerald-100">
                      Trenér: <strong>{upcomingReservations[0].trainer || 'Bude přidělen'}</strong> (20 min EMS)
                    </p>
                  </div>
                  <Link
                    href="/dashboard/rezervace"
                    className="relative z-10 bg-white text-emerald-800 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:bg-emerald-50 transition shrink-0"
                  >
                    Detail rezervací
                  </Link>
                </div>
              )}

              {/* SEZNAM NADCHÁZEJÍCÍCH REZERVACÍ */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <Calendar className="text-emerald-600" size={20} />
                    Nadcházející tréninky
                  </h2>
                  <Link href="/dashboard/nova-lekce" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Přidat lekci
                  </Link>
                </div>

                {upcomingReservations.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl space-y-3">
                    <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-gray-400">
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">Momentálně nemáš naplánovaný žádný trénink.</p>
                    <Link 
                      href="/dashboard/nova-lekce" 
                      className="inline-block text-xs font-bold text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition"
                    >
                      Naplánovat EMS trénink
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingReservations.map((res) => {
                      const resDateObj = parseReservationDateTime(res.date, res.time);
                      const isLocked = (resDateObj.getTime() - Date.now()) / (1000 * 60 * 60) < 24;

                      return (
                        <div key={res.id} className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 transition">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100/80 text-emerald-800 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0">
                              <span>{resDateObj.getDate()}</span>
                              <span className="uppercase text-[9px]">{resDateObj.toLocaleDateString('cs-CZ', { month: 'short' })}</span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                <Clock size={14} className="text-gray-400" />
                                {res.time}
                              </div>
                              <div className="text-xs text-gray-500">Trenér: {res.trainer || 'Bude určen'}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                              Potvrzeno
                            </span>

                            {isLocked ? (
                              <div className="p-2 text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed" title="Lekci již nelze stornovat (méně než 24h do tréninku)">
                                <Lock size={16} />
                              </div>
                            ) : (
                              <button
                                disabled={deletingId === res.id}
                                onClick={() => handleCancelReservation(res.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Zrušit trénink"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* PRAVÝ SLOUPEC: Kredity & Tipy */}
            <div className="space-y-6">
              
              {/* KARTA KREDITŮ A DOBÍJENÍ */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm pb-2 border-b border-gray-100 flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" /> Stav účtu & Kredity
                </h3>
                
                <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-emerald-900 font-medium">
                    <span>Dostupné kredity</span>
                    <span className="bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Konto</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-950">
                    {profile?.credit_balance ?? 0} <span className="text-xs font-normal text-emerald-700">kreditů</span>
                  </div>
                </div>

                <Link
                  href="/dashboard/kredity"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm"
                >
                  <Plus size={16} /> Dokoupit kredity QR kódem
                </Link>
              </div>

              {/* UŽITEČNÝ TIP */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Droplets size={16} /> Pitný režim
                </div>
                <h4 className="font-bold text-sm">Voda je pro EMS klíčová 💧</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nezapomeň před tréninkem i po něm vypít dostatek vody. Správná hydratace zvyšuje účinnost impulsů a urychluje regeneraci.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* DOLNÍ SEKCE 3: OSOBNÍ PROFIL A NASTAVENÍ ÚČTU */}
        {/* ========================================================================= */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Osobní profil a kontaktní údaje</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Poklepáním (double-click) na zvýrazněná pole můžete údaje upravit.
              </p>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">
              Aktivní účet
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Jméno */}
            <div>
              <span className="block text-xs font-semibold text-gray-400 mb-1">Jméno</span>
              <p className="font-medium text-gray-800 bg-gray-50/80 px-3.5 py-2.5 rounded-xl border border-gray-100">
                {profile?.first_name || '—'}
              </p>
            </div>

            {/* Příjmení */}
            <div>
              <span className="block text-xs font-semibold text-gray-400 mb-1">Příjmení</span>
              <p className="font-medium text-gray-800 bg-gray-50/80 px-3.5 py-2.5 rounded-xl border border-gray-100">
                {profile?.last_name || '—'}
              </p>
            </div>

            {/* Email */}
            <div>
              <span className="block text-xs font-semibold text-gray-400 mb-1">E-mailová adresa</span>
              <p className="font-medium text-gray-800 bg-gray-50/80 px-3.5 py-2.5 rounded-xl border border-gray-100 select-all">
                {profile?.email}
              </p>
            </div>

            {/* Datum narození */}
            <div>
              <span className="block text-xs font-semibold text-gray-400 mb-1">Datum narození</span>
              <p className="font-medium text-gray-800 bg-gray-50/80 px-3.5 py-2.5 rounded-xl border border-gray-100">
                {formatDate(profile?.birth_date)}
              </p>
            </div>

            {/* RODNÉ ČÍSLO - EDITOVATELNÉ POUZE POKUD CHYBÍ */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-400">
                  Rodné číslo (variabilní symbol)
                </span>
                {!profile?.birth_number ? (
                  <span className="text-[10px] text-amber-600 font-bold">(double click pro zadání)</span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1">
                    <Lock size={10} /> Nelze měnit
                  </span>
                )}
              </div>

              {!profile?.birth_number ? (
                activeField === 'birth_number' ? (
                  <input
                    autoFocus
                    placeholder="např. 900101/1234"
                    value={editData.birth_number}
                    onChange={(e) => setEditData({ ...editData, birth_number: e.target.value })}
                    onBlur={() => saveFieldRealTime('birth_number')}
                    onKeyDown={(e) => e.key === 'Enter' && saveFieldRealTime('birth_number')}
                    className="w-full border border-emerald-500 rounded-xl px-3.5 py-2 text-sm outline-none bg-emerald-50/30 font-mono"
                  />
                ) : (
                  <div
                    onDoubleClick={() => setActiveField('birth_number')}
                    className="cursor-pointer font-medium text-amber-800 bg-amber-50 hover:bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-amber-200 hover:border-emerald-300 transition flex items-center justify-between"
                  >
                    <span className="text-xs">Chybí rodné číslo - dvakrát poklepejte pro doplnění</span>
                    <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  </div>
                )
              ) : (
                <p className="font-medium text-gray-800 bg-gray-50/80 px-3.5 py-2.5 rounded-xl border border-gray-100 flex items-center justify-between font-mono">
                  <span>{profile.birth_number}</span>
                  <Lock size={14} className="text-gray-400" />
                </p>
              )}
            </div>

            {/* Telefon (Editable) */}
            <div onDoubleClick={() => setActiveField('phone')} className="cursor-pointer">
              <span className="block text-xs font-semibold text-gray-400 mb-1">
                Telefon <span className="text-[10px] text-emerald-600 font-normal">(double click)</span>
              </span>
              {activeField === 'phone' ? (
                <input
                  autoFocus
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  onBlur={() => saveFieldRealTime('phone')}
                  onKeyDown={(e) => e.key === 'Enter' && saveFieldRealTime('phone')}
                  className="w-full border border-emerald-500 rounded-xl px-3.5 py-2 text-sm outline-none bg-emerald-50/30"
                />
              ) : (
                <p className="font-medium text-gray-800 bg-gray-50/80 hover:bg-emerald-50/30 px-3.5 py-2.5 rounded-xl border border-gray-100 hover:border-emerald-300 transition">
                  {profile?.phone || 'Klikni pro zadání telefonního čísla'}
                </p>
              )}
            </div>

            {/* Adresa (Editable) */}
            <div onDoubleClick={() => setActiveField('address')} className="cursor-pointer">
              <span className="block text-xs font-semibold text-gray-400 mb-1">
                Adresa bydliště <span className="text-[10px] text-emerald-600 font-normal">(double click)</span>
              </span>
              {activeField === 'address' ? (
                <input
                  autoFocus
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  onBlur={() => saveFieldRealTime('address')}
                  onKeyDown={(e) => e.key === 'Enter' && saveFieldRealTime('address')}
                  className="w-full border border-emerald-500 rounded-xl px-3.5 py-2 text-sm outline-none bg-emerald-50/30"
                />
              ) : (
                <p className="font-medium text-gray-800 bg-gray-50/80 hover:bg-emerald-50/30 px-3.5 py-2.5 rounded-xl border border-gray-100 hover:border-emerald-300 transition">
                  {profile?.address || 'Klikni pro zadání adresy'}
                </p>
              )}
            </div>
          </div>

          {/* Cíle & Poznámky */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            {/* Moje Cíle */}
            <div onDoubleClick={() => setActiveField('goals')} className="cursor-pointer">
              <span className="block text-xs font-semibold text-gray-400 mb-1">
                Moje tréninkové cíle <span className="text-[10px] text-emerald-600 font-normal">(double click)</span>
              </span>
              {activeField === 'goals' ? (
                <textarea
                  autoFocus
                  value={editData.goals}
                  onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                  onBlur={() => saveFieldRealTime('goals')}
                  className="w-full border border-emerald-500 rounded-xl p-3 text-sm outline-none bg-emerald-50/30"
                  rows={3}
                />
              ) : (
                <div className="text-sm text-gray-700 bg-gray-50/80 hover:bg-emerald-50/30 p-3.5 rounded-xl border border-gray-100 hover:border-emerald-300 transition min-h-[50px]">
                  {profile?.goals || 'Zatím nemáš nastavené žádné cíle. Dvakrát poklepej pro přidání.'}
                </div>
              )}
            </div>

            {/* Poznámky */}
            <div onDoubleClick={() => setActiveField('customer_note')} className="cursor-pointer">
              <span className="block text-xs font-semibold text-gray-400 mb-1">
                Poznámky k mému tréninku <span className="text-[10px] text-emerald-600 font-normal">(double click)</span>
              </span>
              {activeField === 'customer_note' ? (
                <textarea
                  autoFocus
                  value={editData.customer_note}
                  onChange={(e) => setEditData({ ...editData, customer_note: e.target.value })}
                  onBlur={() => saveFieldRealTime('customer_note')}
                  className="w-full border border-emerald-500 rounded-xl p-3 text-sm outline-none bg-emerald-50/30"
                  rows={2}
                />
              ) : (
                <div className="text-sm text-gray-700 bg-gray-50/80 hover:bg-emerald-50/30 p-3.5 rounded-xl border border-gray-100 hover:border-emerald-300 transition min-h-[40px]">
                  {profile?.customer_note || 'Žádné osobní poznámky.'}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}