import Link from 'next/link';
import { Clock, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-900 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hlavní mřížka */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* 1. O společnosti / Branding */}
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-tight text-white">
              EMS <span className="text-emerald-500">Express</span>
            </span>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Efektivní EMS trénink pro vaše tělo. Dosáhněte maximálních výsledků za pouhých 20 minut týdně pod vedením profesionálů.
            </p>
          </div>

          {/* 2. Rychlé odkazy */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Rychlé navigace
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/rezervace" className="hover:text-emerald-400 transition-colors">
                  Rezervace lekce
                </Link>
              </li>
              <li>
                <Link href="/cenik" className="hover:text-emerald-400 transition-colors">
                  Ceník
                </Link>
              </li>
              <li>
                <Link href="/o-ems" className="hover:text-emerald-400 transition-colors">
                  O EMS tréninku
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="hover:text-emerald-400 transition-colors">
                  Náš tým
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Otevírací doba */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Otevírací doba
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-zinc-200">Pondělí – Neděle</p>
                  <p className="text-xs text-zinc-400">6:00 – 19:00 (dle rezervací)</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Kontakt */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Kontakt
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <a href="tel:+420123456789" className="hover:text-emerald-400 transition-colors">
                  +420 777 535 302
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
                <a href="mailto:info@emsexpress.cz" className="hover:text-emerald-400 transition-colors">
                  info@pkznojmo.cz
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Melkusova 44, 671 81, Znojmo</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Spodní lišta - Copyright & Podmínky */}
        <div className="mt-12 border-t border-zinc-800 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-zinc-500">
          <p>&copy; {currentYear} EMS Express. Všechna práva vyhrazena.</p>
          <div className="flex gap-6">
            <Link href="/ochrana-udaju" className="hover:text-zinc-400 transition-colors">
              Ochrana osobních údajů
            </Link>
            <Link href="/podminky" className="hover:text-zinc-400 transition-colors">
              Obchodní podmínky
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}