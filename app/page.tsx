import Link from 'next/link';
import { Zap, Clock, ShieldCheck, MapPin, Phone, Calendar, ArrowRight, Activity, Sparkles, Dumbbell } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen text-slate-800 antialiased selection:bg-[#73C2BE]/30">
      
      {/* --- HERO SEKCE (ÚVOD S CÍLENÍM NA LOKALITU) --- */}
      <section className="relative px-6 pt-24 pb-20 md:pt-32 md:pb-32 max-w-7xl mx-auto overflow-hidden">
        {/* Dekorativní rozostřené pozadí */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-[#73C2BE]/20 to-[#2986BF]/10 rounded-full blur-3xl pointer-events-none z-0" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <span className="inline-flex items-center rounded-full bg-[#73C2BE]/10 px-4 py-1.5 text-xs font-bold text-[#1E388C] ring-1 ring-inset ring-[#73C2BE]/40 tracking-wide uppercase">
            ⚡ Profesionální EMS trénink Znojmo
          </span>
          
          <h1 className="text-4xl font-black tracking-tight text-[#1E388C] sm:text-6xl lg:text-7xl leading-[1.1]">
            Efektivní EMS cvičení: <br />
            <span className="bg-gradient-to-r from-[#1E388C] via-[#2986BF] to-[#73C2BE] bg-clip-text text-transparent">
              Dostaňte se do formy za 20 minut
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Zažijte revoluci ve fitness. Naše moderní EMS studio ve Znojmě vám přináší maximální výsledky pro zpevnění těla, hubnutí a odstranění bolestí zad pod vedením certifikovaného osobního trenéra.
          </p>
          
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/rezervace" 
              className="w-full sm:w-auto rounded-xl bg-[#1E388C] px-8 py-4 text-base font-bold text-white hover:bg-[#2986BF] transition-all shadow-md hover:shadow-xl hover:shadow-[#1E388C]/20 hover:scale-[1.02] active:scale-95 text-center uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Rezervovat trénink
            </Link>
            <Link 
              href="/o-ems" 
              className="w-full sm:w-auto rounded-xl border-2 border-[#2986BF] bg-white px-8 py-4 text-base font-bold text-[#2986BF] hover:bg-[#2986BF]/5 transition-all text-center flex items-center justify-center gap-2"
            >
              Jak to funguje? <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* --- REVOLUČNÍ METODA: HLAVNÍ BENEFITY --- */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-50 via-white to-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E388C] uppercase tracking-tight">
              Proč zvolit elektro-myo-stimulaci (EMS)?
            </h2>
            <div className="w-12 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
            <p className="text-slate-500 font-medium">
              Vědecky podložená metoda cvičení, která šetří váš čas i klouby.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#1E388C]/10 flex items-center justify-center text-[#1E388C]">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#1E388C]">Aktivace 95% svalů najednou</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Při běžném tréninku v posilovně zapojíte jen určité svalové skupiny. Kontrolované EMS impulzy stimulují celé tělo současně, včetně hlubokých stabilizačních svalů kolem páteře.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#2986BF]/10 flex items-center justify-center text-[#2986BF]">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#1E388C]">Trénink trvá pouze 20 minut</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nechcete trávit hodiny ve fitness centru? Jeden 20minutový EMS trénink odpovídá zhruba 3 hodinám intenzivního cvičení s činkami. Stačí vám pouze 1 až 2 lekce týdně.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#73C2BE]/20 flex items-center justify-center text-[#1E388C]">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#1E388C]">Maximálně šetrné ke kloubům</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Protože svaly stimulujeme pomocí elektrických impulzů, nepotřebujete zvedat žádné těžké váhy. Cvičení je proto ideální i pro lidi po zranění nebo s nadváhou.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- NOVÁ EXPANDOVANÁ SEO SEKCE: PRO KOHO JE CVIČENÍ URČENO --- */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#2986BF] uppercase tracking-widest block">Jaké problémy EMS řeší?</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E388C] uppercase tracking-tight leading-tight">
              Dosáhněte svých cílů <br />rychleji a bez bolesti
            </h2>
            <p className="text-slate-600 leading-relaxed">
              EMS cvičení není jen trend pro sportovce. Je to vysoce efektivní nástroj moderní fyzioterapie a fitness navržený tak, aby pomohl každému bez ohledu na věk či aktuální kondici.
            </p>
            <div className="inline-block">
              <Link href="/pro-koho" className="text-[#1E388C] font-bold hover:text-[#2986BF] inline-flex items-center gap-1 group transition-colors">
                Zjistit více o výsledcích cvičení <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="text-[#2986BF] font-bold flex items-center gap-2">
                <Sparkles size={18} /> Rychlé hubnutí
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Intenzivní spalování kalorií pokračuje ještě desítky hodin po ukončení tréninku. Ideální pro redukci tuku a boj s celulitidou.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="text-[#2986BF] font-bold flex items-center gap-2">
                <Activity size={18} /> Konec bolestem zad
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zpevněním hlubokého stabilizačního systému (core) efektivně eliminujete bolesti bederní a krční páteře způsobené sedavým zaměstnáním.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="text-[#2986BF] font-bold flex items-center gap-2">
                <Dumbbell size={18} /> Nárůst svalové hmoty
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cílená stimulace umožňuje izolovaně posilovat ochablé svalové partie a rychle vybudovat pevnou, symetrickou postavu.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="text-[#2986BF] font-bold flex items-center gap-2">
                <ShieldCheck size={18} /> Poporodní zpevnění
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pomáhá maminkám bezpečně zpevnit oslabené svaly pánevního dna a břišní diastázu po porodu bez zatěžování kloubního aparátu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CENÍK / BALÍČKY --- */}
      <section className="bg-slate-50 border-t border-b border-slate-100 px-6 py-24">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E388C] uppercase tracking-tight">Ceník EMS tréninků ve Znojmě</h2>
            <div className="w-12 h-1 bg-[#73C2BE] mx-auto rounded-full"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2986BF] bg-[#2986BF]/5 inline-block px-3 py-1 rounded-md">
              Platba probíhá na místě hotově
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 text-left max-w-4xl mx-auto">
            {/* Jednorázový vstup */}
            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-md">
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#2986BF] uppercase tracking-wider block">Zkušební nebo jednorázová lekce</span>
                <h3 className="text-xl font-extrabold text-[#1E388C] uppercase">1 vstup do studia</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">790</span>
                  <span className="text-lg font-bold text-slate-500">Kč</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ideální na vyzkoušení. V ceně je zapůjčení speciálního EMS oblečení, iontový nápoj na recepci a úvodní tělesná analýza s osobním trenérem.
                </p>
              </div>
            </div>

            {/* Zvýhodněná permanentka */}
            <div className="rounded-2xl border-2 border-[#1E388C] p-8 shadow-md space-y-6 bg-white relative flex flex-col justify-between hover:shadow-xl transition-all group">
              <span className="absolute -top-3 left-6 rounded-md bg-[#1E388C] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                Nejvýhodnější volba
              </span>
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#73C2BE] bg-[#73C2BE]/10 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">Aktivní proměna postavy</span>
                <h3 className="text-xl font-extrabold text-[#1E388C] uppercase">Permanentka 10 vstupů</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#1E388C]">6 900</span>
                  <span className="text-lg font-bold text-[#1E388C]">Kč</span>
                  <span className="text-xs text-slate-400 font-medium ml-2">(690 Kč / lekce)</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Kompletní individuální péče trenéra na každé lekci, zapůjčení veškerého čistého vybavení je započteno v ceně. Platnost permanentky je celých 6 měsíců.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Link href="/cenik" className="text-sm font-bold text-[#2986BF] hover:underline">
              Zobrazit kompletní ceník a podmínky služeb →
            </Link>
          </div>
        </div>
      </section>

      {/* --- KONTAKTNÍ SEKCE S MAPOU / INFORMACEMI --- */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-[#1E388C] uppercase tracking-tight">Kde naše EMS studio najdete?</h2>
          <div className="w-12 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
        </div>
        
        <div className="bg-gradient-to-br from-white via-white to-[#73C2BE]/5 border border-slate-100 rounded-3xl p-8 sm:p-12 max-w-xl mx-auto shadow-xl shadow-slate-100 flex flex-col items-center space-y-6 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#2986BF]/5 rounded-full blur-xl" />

          <div className="w-12 h-12 rounded-full bg-[#1E388C]/5 flex items-center justify-center text-[#1E388C]">
            <MapPin size={24} />
          </div>
          
          <div className="space-y-2">
            <p className="text-slate-900 font-black text-xl uppercase tracking-wide">EMS Znojmo</p>
            <p className="text-slate-500 font-medium text-base">Melkusova 3963/44, 671 81 Znojmo 5</p>
          </div>
          
          <div className="w-full border-t border-slate-100 my-2" />
          
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <Phone size={12} /> Telefonické dotazy
            </div>
            <p className="text-2xl font-black text-[#1E388C] hover:text-[#2986BF] transition-colors">
              <a href="tel:777535302">+420 777 535 302</a>
            </p>
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
            Těšíme se na vaši první proměnu!
          </p>
        </div>
      </section>
    </main>
  );
}