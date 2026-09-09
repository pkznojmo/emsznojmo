'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  Calendar, 
  PlusCircle, 
  LogOut, 
  Clock, 
  X, 
  Users, 
  CalendarDays, 
  LayoutDashboard,
  MoreHorizontal,
  UserCog,
  LucideIcon,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  onLogout: () => Promise<void>;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: "/dashboard", label: "Profil", icon: User },
  { href: "/dashboard/rezervace", label: "Rezervace", icon: Calendar },
  { href: "/dashboard/nova-lekce", label: "Nová lekce", icon: PlusCircle },
  { href: "/dashboard/kredity", label: "Kredity", icon: Coins },
];

const TRAINER_LINKS: NavLinkItem[] = [
  { href: "/dashboard/pravidelny-rozvrh", label: "Pravidelný Rozvrh", icon: Clock },
  { href: "/dashboard/tydenni-rozvrh", label: "Výjimky - Rozvrh", icon: CalendarDays },
  { href: "/dashboard/klienti", label: "Klienti", icon: Users },
];

const ADMIN_LINKS: NavLinkItem[] = [
  { href: "/dashboard/sprava-uzivatelu", label: "Správa uživatelů", icon: UserCog },
];

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('MEMBER');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Načtení uživatelské role s ochranou unmountu
  useEffect(() => {
    let isMounted = true;

    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (data && isMounted) setRole(data.role);
        }
      } catch (error) {
        console.error('Chyba při načítání role:', error);
      }
    };

    checkRole();

    return () => {
      isMounted = false;
    };
  }, []);

  // Blokování scrollování na těle stránky při otevřeném mobilním menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Pomocná funkce pro vyhodnocení aktivního odkazu
  const isActiveRoute = useCallback((href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  }, [pathname]);

  const isTrainerOrAdmin = role === 'TRAINER' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';

  // Kontrola, zda je aktivní jakákoliv trenérská nebo admin záložka
  const isElevatedTabActive = 
    (isTrainerOrAdmin && TRAINER_LINKS.some(link => isActiveRoute(link.href))) ||
    (isAdmin && ADMIN_LINKS.some(link => isActiveRoute(link.href)));

  return (
    <>
      {/* ========================================== */}
      {/* 1. DESKTOP SIDEBAR                         */}
      {/* ========================================== */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 p-6 flex-col justify-between shrink-0 sticky top-24 h-[calc(100vh-6rem)] z-30 overflow-y-auto">
        <div className="w-full space-y-6">
          {/* Hlavička */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block leading-none">Aplikace</span>
              <span className="text-sm font-extrabold text-slate-800">Klientská zóna</span>
            </div>
          </div>

          {/* Klientská navigace */}
          <nav aria-label="Hlavní navigace" className="space-y-1 w-full">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Klientské menu
            </div>
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActiveRoute(link.href);
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide uppercase", 
                    active 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon size={16} className={active ? "text-emerald-400" : "text-slate-400"} /> 
                  {link.label}
                </Link>
              );
            })}

            {/* Trenérská sekce (Zobrazuje se pro TRAINER i ADMIN) */}
            {isTrainerOrAdmin && (
              <div className="pt-5 mt-5 border-t border-slate-100 space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Trenérská zóna
                </div>
                {TRAINER_LINKS.map((link) => {
                  const Icon = link.icon;
                  const active = isActiveRoute(link.href);
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide uppercase", 
                        active 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon size={16} className={active ? "text-emerald-400" : "text-slate-400"} /> 
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Administrátorská sekce (Zobrazuje se pouze pro ADMIN) */}
            {isAdmin && (
              <div className="pt-5 mt-5 border-t border-slate-100 space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Administrace
                </div>
                {ADMIN_LINKS.map((link) => {
                  const Icon = link.icon;
                  const active = isActiveRoute(link.href);
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide uppercase", 
                        active 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon size={16} className={active ? "text-emerald-400" : "text-slate-400"} /> 
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* Odhlášení pro PC */}
        <div className="w-full mt-6 pt-4 border-t border-slate-100">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
            aria-label="Odhlásit se z účtu"
          >
            <LogOut size={16} /> Odhlásit se
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 2. MOBILNÍ BOTTOMBAR                       */}
      {/* ========================================== */}
      <nav 
        aria-label="Mobilní navigace"
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 z-50 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
      >
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const active = isActiveRoute(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-xl transition-all",
                active 
                  ? "text-emerald-600 font-extrabold" 
                  : "text-slate-500 hover:text-slate-800 font-medium"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-all",
                active && "bg-emerald-50 text-emerald-600"
              )}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] tracking-tight leading-none">{link.label}</span>
            </Link>
          );
        })}

        {/* Tlačítko VÍCE / MENU pro mobil */}
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-label="Zobrazit více možností"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-xl transition-all relative",
            (isMobileMenuOpen || isElevatedTabActive) 
              ? "text-emerald-600 font-extrabold" 
              : "text-slate-500 font-medium"
          )}
        >
          <div className={cn(
            "p-1 rounded-lg transition-all",
            (isMobileMenuOpen || isElevatedTabActive) && "bg-emerald-50 text-emerald-600"
          )}>
            {isMobileMenuOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
          </div>
          <span className="text-[10px] tracking-tight leading-none">
            {isAdmin ? 'Admin / Více' : role === 'TRAINER' ? 'Trenér / Více' : 'Více'}
          </span>
        </button>
      </nav>

      {/* ========================================== */}
      {/* 3. MOBILNÍ SLIDE-UP PANEL                  */}
      {/* ========================================== */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          {/* Tmavý podklad (Backdrop) */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Vyjíždějící karta zaspodu */}
          <div className="fixed bottom-16 inset-x-0 bg-white rounded-t-3xl border-t border-slate-200 p-6 z-50 shadow-2xl max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

            {/* Trenérská zóna pro mobil */}
            {isTrainerOrAdmin && (
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  Trenérská zóna
                </div>
                <div className="space-y-1.5">
                  {TRAINER_LINKS.map((link) => {
                    const Icon = link.icon;
                    const active = isActiveRoute(link.href);
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-sm font-bold tracking-wide uppercase", 
                          active 
                            ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                            : "text-slate-700 bg-slate-50 active:bg-slate-100"
                        )}
                      >
                        <Icon size={18} className={active ? "text-emerald-400" : "text-slate-400"} /> 
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Administrátorská zóna pro mobil */}
            {isAdmin && (
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  Administrace
                </div>
                <div className="space-y-1.5">
                  {ADMIN_LINKS.map((link) => {
                    const Icon = link.icon;
                    const active = isActiveRoute(link.href);
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-sm font-bold tracking-wide uppercase", 
                          active 
                            ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                            : "text-slate-700 bg-slate-50 active:bg-slate-100"
                        )}
                      >
                        <Icon size={18} className={active ? "text-emerald-400" : "text-slate-400"} /> 
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tlačítko pro odhlášení */}
            <div className="pt-2">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }} 
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-red-50 text-red-600 active:bg-red-100 font-bold uppercase text-xs tracking-wider rounded-2xl transition-all border border-red-100"
              >
                <LogOut size={18} /> Odhlásit se z účtu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}