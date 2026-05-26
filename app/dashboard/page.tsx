'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../comp/Sidebar'; // Uprav cestu na '@/comp/Sidebar', pokud máš složku comp
import { supabase } from '../../lib/supabase';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  address: string | null;
  clothing_size: string;
  goals: string | null;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const checkUserAndFetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/prihlaseni');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Chyba při načítání profilu:', profileError);
      } else {
        setProfile(profileData);
      }
      
      setLoading(false);
    };

    checkUserAndFetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/prihlaseni');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium">Načítám tvůj profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      
      {/* POUŽITÍ NOVÉHO SIDEBARU */}
      <Sidebar onLogout={handleLogout} />

      {/* HLAVNÍ OBSAH DASHBOARDU */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Ahoj, {profile?.first_name || 'člene'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Vítej ve své EMS klientské zóně. Tady máš přehled o svém nastavení.</p>
        </header>


        {/* PŘEHLED ÚDAJŮ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Osobní informace */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Osobní informace</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Jméno:</span>
                <span className="font-semibold">{profile?.first_name} {profile?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">E-mail:</span>
                <span className="font-semibold">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telefon:</span>
                <span className="font-semibold">{profile?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Datum narození:</span>
                <span className="font-semibold">{profile?.birth_date || 'Neuvedeno'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Adresa:</span>
                <span className="font-semibold text-right max-w-[200px] truncate">{profile?.address || 'Neuvedeno'}</span>
              </div>
            </div>
          </div>

          {/* EMS specifikace a cíle */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">EMS Nastavení & Cíle</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl">
                  <span className="text-emerald-800 text-sm font-medium">Velikost EMS oblečení:</span>
                  <span className="bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-lg text-sm">
                    {profile?.clothing_size}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block mb-1">Tvoje fitness cíle:</span>
                  <div className="bg-gray-50 p-3 rounded-xl text-sm italic text-gray-700 border border-gray-100 min-h-[60px]">
                    {profile?.goals || 'Zatím jsi nezadal žádné specifické cíle.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400 mt-4 text-right">
              Typ účtu: <span className="font-semibold text-emerald-600">{profile?.role}</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}