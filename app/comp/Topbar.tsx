'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '../../lib/supabase';

export default function Topbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const getAuthSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', authUser.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    getAuthSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        getAuthSession();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const publicLinks = [
    { href: "/", label: "Domů" },
    { href: "/o-ems", label: "Co je EMS?" },
    { href: "/pro-koho", label: "Pro koho je EMS?"},
    { href: "/cenik", label: "Ceník" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <>
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-[50] shadow-sm bg-[#DDDDDD] h-20 md:h-24">
        <div className="px-4 sm:px-6 relative z-50 h-full flex items-center">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between md:grid md:grid-cols-3">
            
            {/* 1. Levá část - LOGO */}
            <div className="flex items-center justify-start">
              <Link href="/" className="flex items-center shrink-0">
                <Image 
                  src="/logo.svg" 
                  alt="EMSExpress Logo"
                  width={150}               
                  height={50}               
                  className="h-9 sm:h-10 md:h-16 w-auto object-contain" 
                  priority                  
                />
              </Link>
            </div>

            {/* 2. Prostřední část - NAVIGAČNÍ MENU (pouze na PC) */}
            <ul className="hidden md:flex items-center justify-center gap-6 lg:gap-8 text-[12px] font-bold uppercase tracking-wide">
              {publicLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className={cn(
                      "transition-colors hover:text-[#2563eb] whitespace-nowrap", 
                      pathname === link.href ? 'text-[#2563eb]' : 'text-slate-600'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* 3. Pravá část - PŘIHLÁŠENÍ / KLIENTSKÁ ZÓNA + HAMBURGER */}
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
              ) : user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-slate-700 text-xs font-semibold normal-case hidden lg:inline">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                  <Link 
                    href="/dashboard" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold uppercase px-2.5 sm:px-3.5 py-2 rounded-md shadow-sm transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                  >
                    <LayoutDashboard size={14} />
                    <span>Klientská zóna</span>
                  </Link>
                </div>
              ) : (
                <Link 
                  href="/prihlaseni" 
                  className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] sm:text-[11px] font-bold uppercase px-2.5 sm:px-3.5 py-2 rounded-md shadow-sm transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                >
                  <LogIn size={14} />
                  <span>Přihlásit se</span>
                </Link>
              )}

              {/* Hamburger pro mobil */}
              <button 
                className="md:hidden p-1.5 text-[#2563eb] transition-transform active:scale-95 z-50 ml-1" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Otevřít menu"
              >
                {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>

          </div>
        </div>

        {/* --- DEKORATIVNÍ VLNA NA SPODU NAVBARU --- */}
        <div 
          className="absolute left-0 w-full overflow-hidden pointer-events-none z-20"
          style={{ bottom: '-15px', lineHeight: 0 }}
        >
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full fill-[#DDDDDD]"
            style={{ height: '16px' }}
          >
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </nav>

      {/* --- MOBILNÍ MENU --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-20 md:hidden bg-white/95 backdrop-blur-md flex flex-col justify-start pt-8 px-8 gap-6 font-bold uppercase text-lg z-40 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-4 text-center mt-2">
            {publicLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={cn(
                  "py-2.5 transition-colors active:text-[#2563eb] rounded-xl tracking-wide",
                  pathname === link.href ? 'text-[#2563eb] bg-[#2563eb]/5' : 'text-slate-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}