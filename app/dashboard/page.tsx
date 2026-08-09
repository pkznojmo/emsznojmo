'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../comp/Sidebar'; 
import { supabase } from '../../lib/supabase';

// --- INTERFACES ---
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  address: string | null;
  clothing_size: string;
  goals: string | null;
  customer_note?: string | null;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [editData, setEditData] = useState({ 
    first_name: '', 
    last_name: '', 
    phone: '', 
    address: '',
    goals: '', 
    customer_note: '' 
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });

  const fetchData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      router.push('/prihlaseni');
      return;
    }

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
        goals: profileData.goals || '', 
        customer_note: profileData.customer_note || '' 
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Neuvedeno';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
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
      : { text: 'E-mail odeslán!', isError: false }
    );
    setPasswordLoading(false);
  };

  const saveFieldRealTime = async (fieldName: keyof typeof editData) => {
    if (!profile) return;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium text-sm">
        Načítám klientskou zónu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row text-gray-900">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Hlavní obsah */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto overflow-y-auto w-full">
        {/* Hlavička */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200/60 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Ahoj, {profile?.first_name || 'Kliente'}! 👋
            </h1>
            <p className="text-gray-500 mt-1 text-xs md:text-sm">
              Vítej ve své klientské zóně. Poklepáním (double-click) na zvýrazněné údaje profilu je můžeš rovnou upravit.
            </p>
          </div>
          
          <div className="relative">
            <button
              onClick={handlePasswordReset}
              disabled={passwordLoading}
              className="text-xs bg-white border border-gray-200 font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition disabled:opacity-50 text-gray-700"
            >
              {passwordLoading ? 'Odesílám...' : 'Změnit heslo'}
            </button>
            {passwordMessage.text && (
              <p className={`absolute right-0 mt-1.5 text-xs font-medium ${passwordMessage.isError ? 'text-red-600' : 'text-emerald-600'}`}>
                {passwordMessage.text}
              </p>
            )}
          </div>
        </header>

        {/* Hlavní Layout: 2 sloupce */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Levý sloupec: Osobní Profil */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-base">Osobní údaje</h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium">
                Aktivní účet
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              {/* Jméno */}
              <div>
                <span className="block text-xs font-medium text-gray-400 mb-1">Jméno</span>
                <p className="font-medium text-gray-800 bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
                  {profile?.first_name || '—'}
                </p>
              </div>

              {/* Příjmení */}
              <div>
                <span className="block text-xs font-medium text-gray-400 mb-1">Příjmení</span>
                <p className="font-medium text-gray-800 bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
                  {profile?.last_name || '—'}
                </p>
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <span className="block text-xs font-medium text-gray-400 mb-1">E-mailová adresa</span>
                <p className="font-medium text-gray-800 bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100 select-all">
                  {profile?.email}
                </p>
              </div>

              {/* Telefon (Editable) */}
              <div onDoubleClick={() => setActiveField('phone')} className="cursor-pointer">
                <span className="block text-xs font-medium text-gray-400 mb-1">
                  Telefon <span className="text-[10px] text-emerald-600 font-normal">(double click pro úpravu)</span>
                </span>
                {activeField === 'phone' ? (
                  <input
                    autoFocus
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    onBlur={() => saveFieldRealTime('phone')}
                    onKeyDown={(e) => e.key === 'Enter' && saveFieldRealTime('phone')}
                    className="w-full border border-emerald-500 rounded-lg px-3 py-2 text-sm outline-none bg-emerald-50/30"
                  />
                ) : (
                  <p className="font-medium text-gray-800 bg-gray-50/80 hover:bg-emerald-50/40 px-3 py-2 rounded-lg border border-gray-100 hover:border-emerald-300 transition">
                    {profile?.phone || 'Klikni pro zadání'}
                  </p>
                )}
              </div>

              {/* Datum narození */}
              <div>
                <span className="block text-xs font-medium text-gray-400 mb-1">Datum narození</span>
                <p className="font-medium text-gray-800 bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
                  {formatDate(profile?.birth_date)}
                </p>
              </div>

              {/* Adresa (Editable) */}
                <div onDoubleClick={() => setActiveField('address')} className="sm:col-span-2 cursor-pointer">                <span className="block text-xs font-medium text-gray-400 mb-1">
                  Adresa bydliště <span className="text-[10px] text-emerald-600 font-normal">(double click pro úpravu)</span>
                </span>
                {activeField === 'address' ? (
                  <input
                    autoFocus
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    onBlur={() => saveFieldRealTime('address')}
                    onKeyDown={(e) => e.key === 'Enter' && saveFieldRealTime('address')}
                    className="w-full border border-emerald-500 rounded-lg px-3 py-2 text-sm outline-none bg-emerald-50/30"
                  />
                ) : (
                  <p className="font-medium text-gray-800 bg-gray-50/80 hover:bg-emerald-50/40 px-3 py-2 rounded-lg border border-gray-100 hover:border-emerald-300 transition">
                    {profile?.address || 'Klikni pro zadání adresy'}
                  </p>
                )}
              </div>
            </div>

            {/* Cíle & Poznámky */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              {/* Moje Cíle */}
              <div onDoubleClick={() => setActiveField('goals')} className="cursor-pointer">
                <span className="block text-xs font-medium text-gray-400 mb-1">
                  Moje cíle <span className="text-[10px] text-emerald-600 font-normal">(double click pro úpravu)</span>
                </span>
                {activeField === 'goals' ? (
                  <textarea
                    autoFocus
                    value={editData.goals}
                    onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                    onBlur={() => saveFieldRealTime('goals')}
                    className="w-full border border-emerald-500 rounded-lg p-2.5 text-sm outline-none bg-emerald-50/30"
                    rows={3}
                  />
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50/80 hover:bg-emerald-50/40 p-3 rounded-lg border border-gray-100 hover:border-emerald-300 transition min-h-[50px]">
                    {profile?.goals || 'Zatím nemáš nastavené žádné cíle. Dvakrát poklepej pro přidání.'}
                  </div>
                )}
              </div>

              {/* Poznámky */}
              <div onDoubleClick={() => setActiveField('customer_note')} className="cursor-pointer">
                <span className="block text-xs font-medium text-gray-400 mb-1">
                  Poznámky k tréninku <span className="text-[10px] text-emerald-600 font-normal">(double click pro úpravu)</span>
                </span>
                {activeField === 'customer_note' ? (
                  <textarea
                    autoFocus
                    value={editData.customer_note}
                    onChange={(e) => setEditData({ ...editData, customer_note: e.target.value })}
                    onBlur={() => saveFieldRealTime('customer_note')}
                    className="w-full border border-emerald-500 rounded-lg p-2.5 text-sm outline-none bg-emerald-50/30"
                    rows={2}
                  />
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50/80 hover:bg-emerald-50/40 p-3 rounded-lg border border-gray-100 hover:border-emerald-300 transition min-h-[40px]">
                    {profile?.customer_note || 'Žádné osobní poznámky.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pravý sloupec: Přehledové info kartičky */}
          <div className="space-y-6">
            
            {/* Kartička Permanentka / Členství */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Stav členství</h3>
              
              <div className="bg-red-50/60 border border-red-100 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs text-red-900 font-medium">
                  <span>Balíček EMS Tréninků</span>
                  <span className="bg-red-200/60 px-2 py-0.5 rounded text-[10px]">Neaktivní</span>
                </div>
                <div className="text-2xl font-bold text-red-900">
                  0 <span className="text-xs font-normal text-red-700">/ 0 lekcí</span>
                </div>
                <div className="w-full bg-red-200/50 rounded-full h-2 overflow-hidden mt-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span>Platnost do:</span>
                  <strong className="text-gray-700">21.9.2017</strong>
                </div>
                <div className="flex justify-between">
                  <span>Předplatné:</span>
                  <strong className="text-gray-700">Standard EMS</strong>
                </div>
              </div>
            </div>

            {/* Informační box / Tipy */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
              
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Rychlá rada</span>
              <h4 className="font-medium text-sm">Nezapomínej na pitný režim 💧</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Před i po každém EMS tréninku je klíčové vypít alespoň 0,5 l vody pro správné vyplavení metabolitů ze svalů.
              </p>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}