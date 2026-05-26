'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Calendar, PlusCircle, LogOut, Clock, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  onLogout: () => Promise<void>;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('MEMBER');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Při otevření mobilního menu zakážeme scrollování na pozadí dashboardu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: "/dashboard", label: "Můj Profil", icon: User },
    { href: "/dashboard/rezervace", label: "Moje Rezervace", icon: Calendar },
    { href: "/dashboard/nova-lekce", label: "Nová lekce", icon: PlusCircle },
  ];

  const trainerLinks = [
    { href: "/dashboard/pravidelny-rozvrh", label: "Pravidelný Rozvrh", icon: Clock },
    { href: "/dashboard/tydenni-rozvrh", label: "Týdenní Rozvrh", icon: Clock },
    { href: "/dashboard/klienti", label: "Klienti", icon: Clock },
  ];

  return (
    <>
      {/* --- RESPONSIVNÍ BAR --- 
          Mobil si drží `z-[51]`, pro PC přidáno `md:z-30`, aby sidebar zalézal pod Topbar.tsx 
      */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 flex md:flex-col justify-between shrink-0 sticky top-20 md:top-24 md:h-[calc(100vh-6rem)] z-[51] md:z-30 overflow-y-auto">
        
        {/* Vnitřek pro PC / Horní řádek pro mobil */}
        <div className="w-full flex md:flex-col justify-between md:justify-start items-center md:items-stretch">
          
          {/* Logo */}
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="text-xl md:text-2xl font-bold text-emerald-600 flex items-center gap-2 select-none">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 md:p-2 rounded-lg text-sm md:text-lg font-extrabold">Klientská zóna</span>
          </Link>

          {/* Hamburger tlačítko (zobrazeno pouze na mobilu) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors z-[52] relative"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Klasická navigace pro PC (skrytá na mobilu) */}
          <nav className="hidden md:block space-y-1.5 mt-8 w-full">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", 
                    isActive ? "bg-emerald-50 text-emerald-700 font-bold shadow-sm" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon size={18} /> {link.label}
                </Link>
              );
            })}

            {/* Trenérská sekce pro PC */}
            {role === 'TRAINER' && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Trenérská zóna</div>
                {trainerLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium", 
                        isActive ? "bg-emerald-50 text-emerald-700 font-bold shadow-sm" : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Icon size={18} /> {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* Odhlášení pro PC (skryté na mobilu) */}
        <div className="hidden md:block w-full mt-8 md:mt-auto">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl transition"
          >
            <LogOut size={18} /> Odhlásit se
          </button>
        </div>
      </aside>

      {/* --- MOBILNÍ MENU PŘES CELOU OBRAZOVKU (Zafixováno až pod spodní hranou klientské lišty) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[144px] md:hidden bg-white/96 backdrop-blur-md z-40 flex flex-col justify-between p-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200 overflow-y-auto">
          
          <nav className="space-y-2 mt-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-base font-bold", 
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-700 active:bg-gray-50"
                  )}
                >
                  <Icon size={20} className={isActive ? "text-emerald-700" : "text-gray-400"} /> 
                  {link.label}
                </Link>
              );
            })}

            {/* Trenérská sekce pro mobil */}
            {role === 'TRAINER' && (
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                <div className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Trenérská zóna</div>
                {trainerLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-base font-bold", 
                        isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-700 active:bg-gray-50"
                      )}
                    >
                      <Icon size={20} className={isActive ? "text-emerald-700" : "text-gray-400"} /> 
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Tlačítko odhlásit na spodku mobilního menu */}
          <div className="pb-4 mt-8">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }} 
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-red-50 text-red-600 active:bg-red-100 font-bold rounded-xl transition-all border border-red-100 shadow-sm shadow-red-50"
            >
              <LogOut size={20} /> Odhlásit se
            </button>
          </div>

        </div>
      )}
    </>
  );
}