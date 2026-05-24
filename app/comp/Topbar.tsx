'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Topbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Odkazy upravené pro tvé EMS studio
  const publicLinks = [
    { href: "/", label: "Domů" },
    { href: "#o-ems", label: "Co je EMS?" },
    { href: "#cenik", label: "Ceník" },
    { href: "#kontakt", label: "Kontakt" },
  ];

  return (
    <>
      {/* --- MODRÝ HORNÍ TOP BAR --- */}
      <div className="bg-[#2563eb] text-white py-2 z-60 relative">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
          <div className="flex items-center gap-4">
            <span className="opacity-90 hidden md:block border-r border-white/20 pr-4 italic">
              PK Perfomance Studio - Revoluční 20minutový trénink pod vedením trenéra.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-4 items-center mr-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-200">
                <Menu size={14} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-blue-200">
                <X size={14} />
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 border-l border-white/20 pl-4 sm:pl-6">
              <Link 
                href="/rezervace" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-sm shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                Rezervovat lekci
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- ŠEDÝ NAVBAR S VLNOU --- */}
      <nav className="sticky top-0 z-50 shadow-sm bg-[#DDDDDD]">
        <div className="px-6 relative z-10 h-20 md:h-24 flex items-center">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 text-xl font-bold tracking-tight text-zinc-900">
              EMS<span className="text-[#2563eb]">Express</span>
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
            <button className="md:hidden p-2 text-[#2563eb]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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

      {/* --- MOBILNÍ MENU --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-29 md:hidden bg-white border-b border-slate-200 p-6 flex flex-col gap-4 font-bold uppercase text-sm shadow-lg z-100">
          {publicLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 hover:text-[#2563eb]">
              {link.label}
            </Link>
          ))}
          <hr className="border-slate-200" />
          <Link 
            href="/rezervace" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-orange-600 flex items-center gap-2"
          >
            <UserPlus size={16} /> Rezervace lekce
          </Link>
        </div>
      )}
    </>
  );
}