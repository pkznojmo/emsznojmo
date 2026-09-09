'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, ShieldAlert, Plus, QrCode, CalendarPlus, 
  User, CheckCircle2, X, CreditCard, Clock, UserCheck
} from 'lucide-react';
import Sidebar from '../../comp/Sidebar'; // Upravte cestu k vašemu sidebaru
import { supabase } from '../../../lib/supabase'; // Upravte cestu k Supabase klientovi

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  credit_balance: number;
  created_at: string;
}

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
}

type ModalType = 'CREDIT' | 'QR' | 'RESERVATION' | null;

export default function AdminUsersPage() {
  const router = useRouter();
  
  // Stavy stránky
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stavy modálů
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulářové stavy
  const [creditAmount, setCreditAmount] = useState<number | ''>('');
  const [creditNote, setCreditNote] = useState('Ruční dobití administrátorem');
  
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resTrainerId, setResTrainerId] = useState('');
  const [deductCredit, setDeductCredit] = useState(true);

  // 1. Ochrana routy a načtení dat
  useEffect(() => {
    const initPage = async () => {
      // Autentizace
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/prihlaseni');
        return;
      }

      // Kontrola role ADMIN
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!profile || profile.role !== 'ADMIN') {
        alert('Nemáte oprávnění pro přístup na tuto stránku.');
        router.push('/dashboard');
        return;
      }

      // Načtení uživatelů
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData) setUsers(usersData);

      // Načtení trenérů pro rezervační modál
      const { data: trainersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'TRAINER');

      if (trainersData) setTrainers(trainersData);

      setLoading(false);
    };

    initPage();
  }, [router]);

  // Vyhledávání a filtrování
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [users, searchQuery]);

  // Akce: Otevření modálu
  const openModal = (type: ModalType, user: UserProfile) => {
    setSelectedUser(user);
    setActiveModal(type);
    // Reset formulářů
    setCreditAmount('');
    setCreditNote('Ruční dobití administrátorem');
    setResDate('');
    setResTime('');
    setResTrainerId('');
    setDeductCredit(true);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
  };

  // Akce: Přidání kreditů
  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !creditAmount) return;

    setIsSubmitting(true);
    try {
      const amount = Number(creditAmount);
      const newBalance = (selectedUser.credit_balance || 0) + amount;

      // 1. Update profilu
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ credit_balance: newBalance })
        .eq('id', selectedUser.id);
      
      if (profileErr) throw profileErr;

      // 2. Zápis do transakcí
      const { error: txErr } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.id,
          amount: amount,
          description: creditNote,
        });

      if (txErr) throw txErr;

      // Aktualizace UI
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, credit_balance: newBalance } : u));
      alert(`Úspěšně bylo přidáno ${amount} kreditů.`);
      closeModal();
    } catch (err: any) {
      alert('Chyba při přidávání kreditů: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Akce: Vytvoření rezervace
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resDate || !resTime) return;

    setIsSubmitting(true);
    try {
      let currentCredits = selectedUser.credit_balance || 0;

      // Odečtení kreditu, pokud je zaškrtnuto
      if (deductCredit) {
        if (currentCredits < 1) {
          throw new Error('Uživatel nemá dostatek kreditů pro vytvoření rezervace.');
        }
        
        currentCredits -= 1;
        await supabase
          .from('profiles')
          .update({ credit_balance: currentCredits })
          .eq('id', selectedUser.id);
        
        await supabase.from('credit_transactions').insert({
          user_id: selectedUser.id,
          amount: -1,
          description: `Vytvoření rezervace administrátorem (${resDate} v ${resTime})`,
        });
      }

      // Nalezení jména trenéra
      const selectedTrainer = trainers.find(t => t.id === resTrainerId);
      const trainerName = selectedTrainer 
        ? `${selectedTrainer.first_name || ''} ${selectedTrainer.last_name || ''}`.trim() 
        : 'Trenér EMS';

      // Vytvoření rezervace
      const { error: resErr } = await supabase
        .from('reservations')
        .insert({
          user_id: selectedUser.id,
          trainer_id: resTrainerId || null,
          date: resDate,
          time: resTime,
          trainer: trainerName,
          status: 'CONFIRMED'
        });

      if (resErr) throw resErr;

      // Aktualizace lokálních kreditů v tabulce, pokud se strhávaly
      if (deductCredit) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, credit_balance: currentCredits } : u));
      }

      alert('Rezervace úspěšně vytvořena.');
      closeModal();
    } catch (err: any) {
      alert('Chyba při vytváření rezervace: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
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

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-hidden">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <ShieldAlert size={20} />
              </div>
              <span className="text-sm font-bold text-rose-600 tracking-wider uppercase">Admin Zóna</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Správa uživatelů</h1>
            <p className="text-gray-500 mt-2">Přehled všech registrovaných klientů a trenérů v systému.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Hledat podle jména nebo e-mailu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
        </header>

        {/* TABULKA UŽIVATELŮ */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Uživatel</th>
                  <th className="px-6 py-4">Kontakty</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Kredity</th>
                  <th className="px-6 py-4 text-right">Rychlé akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Nenalezeni žádní uživatelé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            {(user.first_name?.[0] || '')}{(user.last_name?.[0] || 'U')}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-400">ID: {user.id.split('-')[0]}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                          user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' :
                          user.role === 'TRAINER' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role || 'CLIENT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100">
                          <CreditCard size={14} />
                          {user.credit_balance || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal('CREDIT', user)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors group relative"
                            title="Přidat kredity"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => openModal('RESERVATION', user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Vytvořit rezervaci"
                          >
                            <CalendarPlus size={18} />
                          </button>
                          <button 
                            onClick={() => openModal('QR', user)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Zobrazit QR kód"
                          >
                            <QrCode size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Heder Modálu */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {activeModal === 'CREDIT' && 'Správa kreditů'}
                {activeModal === 'RESERVATION' && 'Nová rezervace'}
                {activeModal === 'QR' && 'Klientský QR Kód'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Obsah - Přidání kreditů */}
            {activeModal === 'CREDIT' && (
              <form onSubmit={handleAddCredit} className="p-6 space-y-5">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <User size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Klient</p>
                    <p className="font-bold">{selectedUser?.first_name} {selectedUser?.last_name}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Počet kreditů k přičtení/odečtení</label>
                  <input
                    type="number"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Např. 10 pro dobití, -2 pro stržení"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Poznámka k transakci</label>
                  <input
                    type="text"
                    required
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Ukládám...' : 'Potvrdit transakci'}
                </button>
              </form>
            )}

            {/* Obsah - Vytvoření rezervace */}
            {activeModal === 'RESERVATION' && (
              <form onSubmit={handleCreateReservation} className="p-6 space-y-5">
                 <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-2">
                  <User size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Klient: <span className="font-bold text-gray-900">{selectedUser?.first_name} {selectedUser?.last_name}</span></p>
                    <p className="text-xs text-gray-400">Aktuální kredity: {selectedUser?.credit_balance || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Datum</label>
                    <input
                      type="date"
                      required
                      value={resDate}
                      onChange={(e) => setResDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Čas (HH:MM)</label>
                    <input
                      type="time"
                      required
                      value={resTime}
                      onChange={(e) => setResTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Přiřadit trenéra (volitelné)</label>
                  <select
                    value={resTrainerId}
                    onChange={(e) => setResTrainerId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Jakýkoliv trenér / Nepřiřazeno --</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={deductCredit}
                    onChange={(e) => setDeductCredit(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Odečíst 1 kredit z účtu klienta
                  </span>
                </label>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Vytvářím...' : 'Vytvořit rezervaci'}
                </button>
              </form>
            )}

            {/* Obsah - Zobrazení QR Kódu */}
            {activeModal === 'QR' && selectedUser && (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                  {/* Použití bezplatného externího API pro generování QR kódu (Nevyžaduje instalaci npm balíčku) */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedUser.id)}`} 
                    alt="QR Kód klienta"
                    className="w-48 h-48"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</h4>
                  <p className="text-sm text-gray-500">ID: {selectedUser.id}</p>
                </div>
                <p className="text-xs text-gray-400 mt-4 px-4">
                  Tento QR kód slouží k rychlé identifikaci klienta (např. při vstupu do studia).
                </p>
                <button 
                  onClick={closeModal}
                  className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                >
                  Zavřít
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}