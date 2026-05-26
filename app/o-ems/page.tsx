import Link from 'next/link';
import { ArrowLeft, Zap, CheckCircle2, Clock, ShieldCheck, Dumbbell, Activity, Calendar, Phone } from 'lucide-react';

export default function AboutEmsPage() {
  return (
    <main className="bg-white min-h-screen text-slate-800 antialiased selection:bg-[#73C2BE]/30">
      
      {/* --- HERO / HLAVIČKA STRÁNKY (Full-width pozadí) --- */}
      <section className="w-full relative bg-gradient-to-b from-[#1E388C]/10 via-white to-white px-6 pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#73C2BE]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-[#1E388C] sm:text-5xl uppercase leading-tight">
              Jak přesně EMS cvičení funguje?
            </h1>
            <div className="w-16 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
            <p className="text-lg text-slate-600 font-normal leading-relaxed">
              Poznejte vědecký princip elektro-myo-stimulace. Zjistěte, proč pouhých 20 minut tréninku dokáže kompletně nahradit hodiny strávené v klasické posilovně.
            </p>
          </div>
        </div>
      </section>

      {/* --- VĚDECKÝ PRINCIP A SROVNÁNÍ --- */}
      <section className="w-full py-20 px-6">
        <div className="max-w-5xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#2986BF] uppercase tracking-widest block">Metoda podložená vědou</span>
            <h2 className="text-3xl font-black text-[#1E388C] uppercase tracking-tight">
              Přirozený pohyb zesílený technologií
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Při jakémkoliv běžném pohybu posílá mozek skrze nervovou soustavu bioelektrické signály (impulzy), které přikazují svalům, aby se stáhly a vykonaly práci.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Moderní technologie EMS dělá přesně totéž, ale mnohem efektivněji zvenčí. Speciální tréninková vesta vysílá jemné, kontrolované impulzy přímo do svalů. Tento impulz je pro tělo zcela přirozený – sval nepozná, zda povel přišel z mozku nebo z elektrody, a začne intenzivně pracovat.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-[#1E388C] uppercase tracking-tight flex items-center gap-2">
              <Zap size={20} className="text-[#2986BF]" /> EMS vs. Klasická posilovna
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="pb-4 border-b border-slate-200/60">
                <p className="font-bold text-slate-800">Zapojení svalstva najednou</p>
                <p className="text-slate-500 text-xs mt-1">Běžné fitness: cca 40–50 % svalových vláken. <br /><span className="text-[#1E388C] font-semibold">EMS trénink: až 95 % svalstva současně.</span></p>
              </div>

              <div className="pb-4 border-b border-slate-200/60">
                <p className="font-bold text-slate-800">Hluboký stabilizační systém (Core)</p>
                <p className="text-slate-500 text-xs mt-1">Běžné fitness: velmi těžko dosažitelný bez specifických cviků. <br /><span className="text-[#1E388C] font-semibold">EMS trénink: impulzy automaticky zpevňují hluboké svaly kolem páteře.</span></p>
              </div>

              <div>
                <p className="font-bold text-slate-800">Časová náročnost</p>
                <p className="text-slate-500 text-xs mt-1">Běžné fitness: 3x týdně 60–90 minut dření s činkami. <br /><span className="text-[#1E388C] font-semibold">EMS trénink: stačí 1x až 2x týdně pouhých 20 minut.</span></p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- HLAVNÍ PILÍŘE EFEKTIVITY (Full-width šedé pozadí) --- */}
      <section className="w-full bg-slate-50 border-t border-b border-slate-100 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E388C] uppercase tracking-tight">
              3 pilíře rychlých výsledků
            </h2>
            <div className="w-12 h-1 bg-[#73C2BE] mx-auto rounded-full"></div>
            <p className="text-sm text-slate-500 font-medium">
              Proč je elektro-myo-stimulace nejefektivnější tréninkovou metodou současnosti.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1E388C]/10 flex items-center justify-center text-[#1E388C]">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E388C]">Časová úspora pro vytížené</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protože svaly dostávají impulsy kontinuálně v krátkých intervalech, tělo vykoná obrovské množství práce za zlomek času. 20 minut plně nahradí zdlouhavé hodiny strávené přecházením od stroje ke stroji v posilovně.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#2986BF]/10 flex items-center justify-center text-[#2986BF]">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E388C]">Nulové zatížení kloubů a šlach</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Při EMS tréninku neodcházíte se zničenými klouby. Odpor nevytváříte zvedáním těžkých kovových vah, nýbrž samotnou stimulací. Metoda je maximálně bezpečná pro lidi s nadváhou či po zraněních.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#73C2BE]/20 flex items-center justify-center text-[#1E388C]">
                <Dumbbell size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E388C]">Rovnoměrné odstranění dysbalancí</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Většina z nás ulevuje jedné straně těla, což vede k jednostrannému přetěžování a bolestem. EMS přístroj dokáže posílat impulzy naprosto symetricky a probudí i svaly, které běžně zapomínáte zapojit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRŮBĚH PRVNÍHO TRÉNINKU (SEO KROKY) --- */}
      <section className="w-full py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E388C] uppercase tracking-tight">
              Jak probíhá vaše první návštěva?
            </h2>
            <div className="w-12 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
            <p className="text-sm text-slate-500 font-medium">
              Celým procesem vás krok za krokem provede osobní trenér.
            </p>
          </div>

          <div className="space-y-10 relative before:absolute before:inset-0 before:left-4 sm:before:left-1/2 before:w-0.5 before:bg-slate-100 before:h-full">
            
            {/* Krok 1 */}
            <div className="relative flex flex-col sm:flex-row items-start sm:justify-between gap-6 group">
              <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1E388C] border-4 border-white text-white flex items-center justify-center text-xs font-bold z-10 shadow-sm">
                1
              </div>
              <div className="sm:w-[45%] pl-10 sm:pl-0 sm:text-right space-y-2">
                <h4 className="font-bold text-[#1E388C] text-lg">Konzultace</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nejdříve probereme vaše cíle (redukce váhy, nabrání svalů, úleva od bolesti zad) a zdravotní stav.
                </p>
              </div>
              <div className="hidden sm:block sm:w-[45%]" />
            </div>

            {/* Krok 2 */}
            <div className="relative flex flex-col sm:flex-row items-start sm:justify-between gap-6 group">
              <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#2986BF] border-4 border-white text-white flex items-center justify-center text-xs font-bold z-10 shadow-sm">
                2
              </div>
              <div className="hidden sm:block sm:w-[45%]" />
              <div className="sm:w-[45%] pl-12 sm:pl-0 space-y-2">
                <h4 className="font-bold text-[#1E388C] text-lg">Oblečení do EMS vesty</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zapůjčíme vám speciální přiléhavé funkční triko a legíny, které perfektně vedou impulzy. Na toto prádlo vám trenér nasadí navlhčenou vestu a pásy na ruce, hýždě a stehna.
                </p>
              </div>
            </div>

            {/* Krok 3 */}
            <div className="relative flex flex-col sm:flex-row items-start sm:justify-between gap-6 group">
              <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#73C2BE] border-4 border-white text-white flex items-center justify-center text-xs font-bold z-10 shadow-sm">
                3
              </div>
              <div className="sm:w-[45%] pl-12 sm:pl-0 sm:text-right space-y-2">
                <h4 className="font-bold text-[#1E388C] text-lg">Samotný 20minutový trénink</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trenér zapne přístroj a začne postupně a citlivě přidávat intenzitu na jednotlivé svalové partie podle vašich pocitů. Pod jeho vedením provádíte jednoduché cviky (dřepy, výdrže, rotace).
                </p>
              </div>
              <div className="hidden sm:block sm:w-[45%]" />
            </div>

          </div>
        </div>
      </section>

      {/* --- ODPOVĚDNOST A BEZPEČNOST (Full-width jemné tyrkysové pozadí) --- */}
      <section className="w-full bg-[#73C2BE]/10 border-t border-b border-[#73C2BE]/20 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#1E388C]/5 flex items-center justify-center text-[#1E388C] mx-auto">
            <Activity size={24} />
          </div>
          <h3 className="text-xl font-black text-[#1E388C] uppercase tracking-tight">Je EMS cvičení bezpečné?</h3>
          <p className="text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed font-medium">
            Ano, naprosto Svalová stimulace se v medicíně a špičkové sportovní rehabilitaci používá již desítky let. Impulzy jsou nízkofrekvenční a stimulují výhradně kosterní svalstvo, nikoliv vnitřní orgány či srdce. Cvičení probíhá vždy za asistence certifikovaného trenéra, který má plnou kontrolu nad přístrojem.
          </p>
        </div>
      </section>

      {/* --- SPODNÍ ODKAZY A CTA (Full-width modrý přechod) --- */}
      <section className="w-full bg-gradient-to-br from-[#1E388C] to-[#2986BF] text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#73C2BE]/20 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Chcete si EMS vyzkoušet na vlastní kůži?
            </h3>
            <p className="text-slate-100 text-sm opacity-90 max-w-md mx-auto">
              Zarezervujte si úvodní lekci a udělejte první krok pro své zdraví ještě dnes!
            </p>
            
            <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                href="/rezervace" 
                className="w-full sm:w-auto rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#1E388C] hover:bg-slate-50 transition-all uppercase tracking-wider shadow-md inline-flex items-center justify-center gap-2"
              >
                <Calendar size={16} /> Rezervovat lekci online
              </Link>
              <Link 
                href="/cenik" 
                className="w-full sm:w-auto rounded-xl border border-white/30 bg-transparent px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-all uppercase tracking-wider"
              >
                Prohlédnout ceník
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}