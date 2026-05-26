'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, UserPlus, LogIn, LayoutDashboard } from "lucide-react";
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
    { href: "/#o-ems", label: "Co je EMS?" },
    { href: "/#cenik", label: "Ceník" },
    { href: "/#kontakt", label: "Kontakt" },
  ];

  return (
    <>
      {/* --- MODRÝ HORNÍ TOP BAR --- */}
      <div className="bg-[#2563eb] text-white py-2 z-[60] relative">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
          <div className="flex items-center gap-4">
            <span className="opacity-90 hidden md:block border-r border-white/20 pr-4 italic">
              PK Performance Studio - Revoluční 20minutový trénink pod vedením trenéra.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-4 items-center mr-2">
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors" aria-label="Facebook">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors" aria-label="Instagram">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 border-l border-white/20 pl-4 sm:pl-6 min-h-[28px]">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <span className="text-emerald-300 normal-case hidden sm:inline">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                  <Link 
                    href="/dashboard" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-sm shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <LayoutDashboard size={12} /> Vstoupit do klientské zóny
                  </Link>
                </div>
              ) : (
                <Link 
                  href="/prihlaseni" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-sm shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <LogIn size={12} /> Přihlásit se
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- ŠEDÝ NAVBAR S VLNOU --- */}
      <nav className="sticky top-0 z-[50] shadow-sm bg-[#DDDDDD] h-20 md:h-24">
        <div className="px-6 relative z-50 h-full flex items-center">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            
            <Link href="/" className="flex items-center shrink-0">
              <Image 
                src="/logo.svg" 
                alt="EMSExpress Logo"
                width={150}               
                height={50}               
                className="h-10 md:h-18 w-auto object-contain" 
                priority                  
              />
            </Link>

            {/* Odkazy pro PC */}
            <ul className="hidden md:flex items-center justify-end gap-8 text-[12px] font-bold uppercase tracking-wide">
              {publicLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className={cn(
                      "transition-colors hover:text-[#2563eb]", 
                      pathname === link.href ? 'text-[#2563eb]' : 'text-slate-600'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Hamburger pro mobil */}
            <button className="md:hidden p-2 text-[#2563eb] transition-transform active:scale-95 z-50" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
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

      {/* --- MODERNÍ CELOOBRAZOVKOVÉ MOBILNÍ MENU S BLUREM --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-20 md:hidden bg-white/94 backdrop-blur-md flex flex-col justify-start pt-12 px-8 gap-6 font-bold uppercase text-lg z-40 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-5 text-center mt-4">
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

          <hr className="border-slate-200/80 my-2" />
          
          <div className="flex flex-col items-center justify-center">
            {user ? (
              <Link 
                href="/dashboard" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full max-w-sm text-center bg-emerald-500 text-white py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-emerald-100 active:scale-98 transition-transform"
              >
                <LayoutDashboard size={18} /> Klientská zóna ({profile?.first_name})
              </Link>
            ) : (
              <Link 
                href="/prihlaseni" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full max-w-sm text-center bg-orange-500 text-white py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-orange-100 active:scale-98 transition-transform"
              >
                <LogIn size={18} /> Přihlásit se
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}