import Link from 'next/link';
import { Zap, Clock, ShieldCheck, MapPin, Phone, Calendar } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen text-slate-800 antialiased selection:bg-[#73C2BE]/30">
      
      {/* --- HERO SEKCE (ÚVOD) --- */}
      <section className="relative px-6 pt-24 pb-20 md:pt-32 md:pb-28 max-w-7xl mx-auto overflow-hidden">
        {/* Dekorativní rozostřené pozadí pro moderní nádech */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-[#73C2BE]/20 to-[#2986BF]/10 rounded-full blur-3xl pointer-events-none z-0" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <span className="inline-flex items-center rounded-full bg-[#73C2BE]/10 px-4 py-1.5 text-xs font-bold text-[#1E388C] ring-1 ring-inset ring-[#73C2BE]/40 tracking-wide uppercase">
            ⚡ Nejlepší cvičení pro zpevnění celého těla
          </span>
          
          <h1 className="text-4xl font-black tracking-tight text-[#1E388C] sm:text-6xl lg:text-7xl leading-[1.1]">
            Dostaňte se do formy <br />
            <span className="bg-gradient-to-r from-[#1E388C] via-[#2986BF] to-[#73C2BE] bg-clip-text text-transparent">
              rychlostí blesku
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Zažijte revoluční 20minutový EMS trénink. Maximální výsledky pro vaše svaly, klouby a kondici pod vedením certifikovaného osobního trenéra.
          </p>
          
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/rezervace" 
              className="w-full sm:w-auto rounded-xl bg-orange-500 px-8 py-4 text-base font-bold text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-xl hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-95 text-center uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Rezervovat trénink
            </Link>
            <Link 
              href="#o-ems" 
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#1E388C] transition-all text-center"
            >
              Zjistit více
            </Link>
          </div>
        </div>
      </section>

      {/* --- SEKCE: JAK FUNGUJE EMS (Moderní Grid) --- */}
      <section id="o-ems" className="py-24 px-6 bg-gradient-to-b from-slate-50 via-white to-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E388C] uppercase tracking-tight">
              Jak funguje EMS cvičení?
            </h2>
            <div className="w-12 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
            <p className="text-slate-500 font-medium">
              Elektro-myo-stimulace aneb nejefektivnější metoda současnosti.
            </p>
          </div>

          {/* 3-sloupcový přehled benefitů */}
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#1E388C]/10 flex items-center justify-center text-[#1E388C]">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E388C] uppercase">95% Aktivace</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Při klasickém cvičení mozek stimuluje svaly omezeně. EMS dělá totéž zvenčí a zapojí až 95 % svalstva najednou, včetně hlubokého stabilizačního systému.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#2986BF]/10 flex items-center justify-center text-[#2986BF]">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E388C] uppercase">Pouhých 20 minut</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Čas je luxus. Jeden krátký 20minutový trénink plně nahradí přibližně 3 hodiny intenzivní dřiny v běžné posilovně. Stačí cvičit 1–2× týdně.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#73C2BE]/20 flex items-center justify-center text-[#1E388C]">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E388C] uppercase">Šetrné ke kloubům</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Cvičení probíhá bez jakýchkoliv těžkých vah či činek. Svaly dostávají maximální zabrat, zatímco vaše klouby, šlachy a vazy zůstávají v naprostém bezpečí.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CENÍK / BALÍČKY --- */}
      <section id="cenik" className="max-w-5xl mx-auto px-6 py-12 text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1E388C] uppercase tracking-tight">Ceník tréninků</h2>
          <div className="w-12 h-1 bg-[#73C2BE] mx-auto rounded-full"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2986BF] bg-[#2986BF]/5 inline-block px-3 py-1 rounded-md">
            Platba probíhá na místě hotově
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 text-left max-w-4xl mx-auto">
          {/* Klasická světlá karta */}
          <div className="rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6 bg-white flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-md">
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#2986BF] uppercase tracking-wider block">Jednorázový trénink</span>
              <h3 className="text-xl font-extrabold text-[#1E388C] uppercase">1 vstup</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">750</span>
                <span className="text-lg font-bold text-slate-500">Kč</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Ideální na vyzkoušení. Včetně zapůjčení speciálního EMS oblečení, iontového nápoje a úvodní tělesné analýzy s osobním trenérem.
              </p>
            </div>
          </div>

          {/* Hlavní prémiová karta */}
          <div className="rounded-2xl border-2 border-[#1E388C] p-8 shadow-md space-y-6 bg-white relative flex flex-col justify-between hover:shadow-xl transition-all group">
            <span className="absolute -top-3 left-6 rounded-md bg-[#1E388C] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Doporučujeme
            </span>
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#73C2BE] bg-[#73C2BE]/10 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">Aktivní proměna</span>
              <h3 className="text-xl font-extrabold text-[#1E388C] uppercase">Permanentka 10 vstupů</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#1E388C]">6 500</span>
                <span className="text-lg font-bold text-[#1E388C]">Kč</span>
                <span className="text-xs text-slate-400 font-medium ml-2">(650 Kč / lekce)</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Kompletní péče trenéra na každé lekci, zapůjčení veškerého čistého vybavení v ceně. Platnost permanentky je plných 6 měsíců.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- INFO SEKCE / KONTAKT --- */}
      <section id="kontakt" className="max-w-7xl mx-auto px-6 py-24 text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-[#1E388C] uppercase tracking-tight">Kde nás najdete?</h2>
          <div className="w-12 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
        </div>
        
        <div className="bg-gradient-to-br from-white via-white to-[#73C2BE]/5 border border-slate-100 rounded-3xl p-8 sm:p-12 max-w-xl mx-auto shadow-xl shadow-slate-100 flex flex-col items-center space-y-6 relative overflow-hidden">
          {/* Jemný dekorativní prvek do rohu boxu */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#2986BF]/5 rounded-full blur-xl" />

          <div className="w-12 h-12 rounded-full bg-[#1E388C]/5 flex items-center justify-center text-[#1E388C]">
            <MapPin size={24} />
          </div>
          
          <div className="space-y-2">
            <p className="text-slate-900 font-black text-xl uppercase tracking-wide">EMS Express Studio</p>
            <p className="text-slate-500 font-medium text-base">Marušky Kudeříkové 622/8, Znojmo</p>
          </div>
          
          <div className="w-full border-t border-slate-100 my-2" />
          
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <Phone size={12} /> Telefonické rezervace
            </div>
            <p className="text-2xl font-black text-[#1E388C] hover:text-[#2986BF] transition-colors">
              <a href="tel:777535302">+420 777 535 302</a>
            </p>
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
            Těšíme se na vaši návštěvu!
          </p>
        </div>
      </section>
    </div>
  );
}