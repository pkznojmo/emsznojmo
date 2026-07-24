'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Calendar, PlusCircle, LogOut, Clock, Menu, X, Users, CalendarDays, LayoutDashboard } from 'lucide-react';
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
    { href: "/dashboard/tydenni-rozvrh", label: "Týdenní Rozvrh", icon: CalendarDays },
    { href: "/dashboard/klienti", label: "Klienti", icon: Users },
  ];

  return (
    <>
      {/* --- SIDEBAR PRO DESKTOP & HORNÍ PANEL PRO MOBIL --- */}
      <aside className="w-full md:w-64 bg-slate-50/50 md:bg-white border-b md:border-b-0 md:border-r border-slate-200/80 p-4 md:p-6 flex md:flex-col justify-between shrink-0 sticky top-20 md:top-24 md:h-[calc(100vh-6rem)] z-30 overflow-y-auto">
        
        <div className="w-full flex md:flex-col justify-between md:justify-start items-center md:items-stretch">
          
          {/* Hlavička klientské zóny */}
          <div className="flex items-center justify-between w-full md:mb-6 md:pb-4 md:border-b md:border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block leading-none">Aplikace</span>
                <span className="text-sm font-extrabold text-slate-800">Klientská zóna</span>
              </div>
            </div>

            {/* Hamburger pro mobil */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-emerald-600 transition-colors rounded-lg bg-white border border-slate-200/80"
              aria-label="Otevřít menu klientské zóny"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Navigace pro PC */}
          <nav className="hidden md:block space-y-1 w-full">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Klientské menu
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide uppercase", 
                    isActive 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-emerald-400" : "text-slate-400"} /> 
                  {link.label}
                </Link>
              );
            })}

            {/* Trenérská sekce pro PC */}
            {role === 'TRAINER' && (
              <div className="pt-5 mt-5 border-t border-slate-100 space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Trenérská zóna
                </div>
                {trainerLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide uppercase", 
                        isActive 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon size={16} className={isActive ? "text-emerald-400" : "text-slate-400"} /> 
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* Odhlášení pro PC */}
        <div className="hidden md:block w-full mt-6 pt-4 border-t border-slate-100">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
          >
            <LogOut size={16} /> Odhlásit se
          </button>
        </div>
      </aside>

      {/* --- MOBILNÍ MENU KLIENTSKÉ ZÓNY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-20 md:hidden bg-white/95 backdrop-blur-md z-40 flex flex-col justify-between p-6 animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto">
          
          <nav className="space-y-2 mt-2">
            <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Klientské menu
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide uppercase", 
                    isActive 
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                      : "text-slate-700 bg-slate-50 active:bg-slate-100"
                  )}
                >
                  <Icon size={18} className={isActive ? "text-emerald-400" : "text-slate-400"} /> 
                  {link.label}
                </Link>
              );
            })}

            {/* Trenérská sekce na mobilu */}
            {role === 'TRAINER' && (
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Trenérská zóna
                </div>
                {trainerLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide uppercase", 
                        isActive 
                          ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                          : "text-slate-700 bg-slate-50 active:bg-slate-100"
                      )}
                    >
                      <Icon size={18} className={isActive ? "text-emerald-400" : "text-slate-400"} /> 
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Odhlášení na mobilu */}
          <div className="pt-6 border-t border-slate-100 mt-auto">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }} 
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 active:bg-red-100 font-bold uppercase text-xs tracking-wider rounded-xl transition-all border border-red-100"
            >
              <LogOut size={18} /> Odhlásit se
            </button>
          </div>

        </div>
      )}
    </>
  );
}