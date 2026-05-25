'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Calendar, PlusCircle, LogOut, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';


interface SidebarProps {
  onLogout: () => Promise<void>;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('MEMBER');

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) setRole(data.role);
      }
    };
    checkRole();
  }, []);

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-col justify-between shrink-0">
      <div>
        <Link href="/" className="text-2xl font-bold text-emerald-600 mb-8 flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-700 p-2 rounded-lg text-lg font-extrabold">EMS</span>
          Studio
        </Link>

        <nav className="space-y-2">
          {/* Společné menu pro všechny */}
          <Link href="/dashboard" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", pathname === '/dashboard' ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}>
            <User size={18} /> Můj Profil
          </Link>
          <Link href="/dashboard/rezervace" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", pathname === '/dashboard/rezervace' ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}>
            <Calendar size={18} /> Moje Rezervace
          </Link>
          <Link href="/dashboard/nova-lekce" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", pathname === '/dashboard/nova-lekce' ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}>
            <PlusCircle size={18} /> Nová lekce
          </Link>

          {/* TRENÉRSKÁ ZÓNA (Zobrazí se jen pokud role == TRAINER) */}
          {role === 'TRAINER' && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Trenérská zóna</div>
              <Link href="/dashboard/pravidelny-rozvrh" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", pathname === '/dashboard/pravidelny-rozvrh' ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}>
                <Clock size={18} /> Pravidelný Rozvrh
              </Link>
              <Link href="/dashboard/tydenni-rozvrh" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", pathname === '/dashboard/tydenni-rozvrh' ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}>
                <Clock size={18} /> Týdenní Rozvrh
              </Link>
              <Link href="/dashboard/klienti" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", pathname === '/dashboard/klienti' ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}>
                <Clock size={18} /> Klienti
              </Link>
            </div>
          )}
        </nav>
      </div>

      <button onClick={onLogout} className="mt-8 md:mt-0 w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl transition">
        <LogOut size={18} /> Odhlásit se
      </button>
    </aside>
  );
}