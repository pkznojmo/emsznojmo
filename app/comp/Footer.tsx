import Link from 'next/link';
import { Clock, Phone, Mail, MapPin, Building2 } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-900 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Hlavní mřížka */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* 1. O společnosti */}
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-tight text-white">
              EMS <span className="text-emerald-500">Express</span>
            </span>

            <p className="text-sm leading-relaxed text-zinc-400">
              Efektivní EMS trénink pro vaše tělo. Dosáhněte maximálních
              výsledků za pouhých 20 minut týdně pod vedením profesionálů.
            </p>

            <div className="pt-2 text-xs leading-6 text-zinc-500">
              <p>Plavecký klub Znojmo z. s.</p>
              <p>IČO: 06441254</p>
              <p>spisová značka L 23204 vedená u Krajského soudu v Brně</p>
            </div>
          </div>

          {/* 2. Rychlé odkazy */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Rychlé navigace
            </h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/rezervace"
                  className="transition-colors hover:text-emerald-400"
                >
                  Rezervace lekce
                </Link>
              </li>

              <li>
                <Link
                  href="/cenik"
                  className="transition-colors hover:text-emerald-400"
                >
                  Ceník
                </Link>
              </li>

              <li>
                <Link
                  href="/o-ems"
                  className="transition-colors hover:text-emerald-400"
                >
                  O EMS tréninku
                </Link>
              </li>

              <li>
                <Link
                  href="/kontakt"
                  className="transition-colors hover:text-emerald-400"
                >
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Provozovna */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Provozovna
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                <div>
                  <p className="font-medium text-zinc-200">
                    Plavecký bazén Louka
                  </p>
                  <p className="leading-6 text-zinc-400">
                    Melkusova 3963/44
                    <br />
                    Znojmo
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                <div>
                  <p className="font-medium text-zinc-200">Sídlo</p>
                  <p className="leading-6 text-zinc-400">
                    Marušky Kudeříkové 622/8
                    <br />
                    669 02 Znojmo
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                <div>
                  <p className="font-medium text-zinc-200">
                    Pondělí – Neděle
                  </p>
                  <p className="text-xs text-zinc-400">
                    6:00 – 19:00 (dle rezervací)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Kontakt */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Kontakt
            </h3>

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-emerald-500" />

                <a
                  href="tel:+420777535302"
                  className="transition-colors hover:text-emerald-400"
                >
                  +420 777 535 302
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-emerald-500" />

                <a
                  href="mailto:info@pkznojmo.cz"
                  className="transition-colors hover:text-emerald-400"
                >
                  info@pkznojmo.cz
                </a>
              </li>

              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                <span>
                  Melkusova 3963/44
                  <br />
                  Znojmo
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Spodní lišta */}
        <div className="mt-12 flex flex-col gap-5 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          
          <div className="space-y-1">
            <p>
              &copy; {currentYear} EMS Express. Všechna práva vyhrazena.
            </p>

            <p>
              Provozovatel: Plavecký klub Znojmo z. s. · IČO 06441254
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/ochrana-udaju"
              className="transition-colors hover:text-zinc-300"
            >
              Ochrana osobních údajů
            </Link>

            <Link
              href="/obchodni-podminky"
              className="transition-colors hover:text-zinc-300"
            >
              Obchodní podmínky
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
