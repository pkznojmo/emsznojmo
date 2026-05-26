import Link from 'next/link';
import { Calendar, Check, Info, ArrowLeft, Phone, CreditCard, Award, Sparkles, HelpCircle } from 'lucide-react';

export default function PricelistPage() {
  return (
    <main className="bg-white min-h-screen text-slate-800 antialiased selection:bg-[#73C2BE]/30">
      
      {/* --- HERO / HLAVIČKA STRÁNKY --- */}
      <section className="w-full relative bg-gradient-to-b from-[#1E388C]/10 via-white to-white px-6 pt-16 pb-12 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#73C2BE]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-[#1E388C] sm:text-5xl uppercase">
            Ceník EMS Tréninků
          </h1>
          <div className="w-16 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Investice do vašeho zdraví a úspory času. Žádné skryté poplatky – veškeré profesionální fitness vybavení a péče osobního trenéra jsou vždy v ceně.
          </p>
        </div>
      </section>

      {/* --- HLAVNÍ CENNÍKOVÉ KARTY --- */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          
          {/* KARTA 1: ÚVODNÍ ZKUŠEBNÍ VSTUP */}
          <div className="rounded-2xl border border-slate-200 p-8 bg-white flex flex-col justify-between hover:border-slate-300 shadow-sm hover:shadow-md transition-all group">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#2986BF] uppercase tracking-widest block">Pro nováčky</span>
                <h3 className="text-2xl font-black text-[#1E388C] uppercase">Úvodní lekce</h3>
                <p className="text-xs text-slate-500">Ideální na vyzkoušení a seznámení se s metodou EMS.</p>
              </div>
              
              <div className="flex items-baseline gap-1 py-2 border-t border-b border-slate-100">
                <span className="text-5xl font-black text-slate-900">490</span>
                <span className="text-xl font-bold text-slate-500">Kč</span>
                <span className="text-xs text-[#2986BF] font-semibold ml-auto bg-[#2986BF]/5 px-2 py-1 rounded">Jednorázově</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>Úvodní konzultace a analýza cílů</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>Kompletní diagnostika těla (InBody)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>Zapůjčení speciálního EMS oblečení zdarma</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>20 minut tréninku s certifikovaným trenérem</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link 
                href="/rezervace" 
                className="block w-full rounded-xl border-2 border-[#1E388C] bg-white py-3 px-4 text-center text-sm font-bold text-[#1E388C] hover:bg-[#1E388C] hover:text-white transition-all uppercase tracking-wider"
              >
                Vyzkoušet EMS
              </Link>
            </div>
          </div>

          {/* KARTA 2: JEDNORÁZOVÝ VSTUP */}
          <div className="rounded-2xl border border-slate-200 p-8 bg-white flex flex-col justify-between hover:border-slate-300 shadow-sm hover:shadow-md transition-all group">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Bez závazků</span>
                <h3 className="text-2xl font-black text-[#1E388C] uppercase">1 Trénink</h3>
                <p className="text-xs text-slate-500">Jednorázový trénink bez dlouhodobé permanentky.</p>
              </div>
              
              <div className="flex items-baseline gap-1 py-2 border-t border-b border-slate-100">
                <span className="text-5xl font-black text-slate-900">790</span>
                <span className="text-xl font-bold text-slate-500">Kč</span>
                <span className="text-xs text-slate-400 font-semibold ml-auto">/ lekce</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>100% individuální vedení osobního trenéra</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>Zapůjčení profi EMS prádla a ručníku</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>Iontový nápoj nebo čerstvá káva v ceně</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#73C2BE] shrink-0 mt-0.5" />
                  <span>Zázemí sprch, sprchový gel a kosmetika</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link 
                href="/rezervace" 
                className="block w-full rounded-xl border-2 border-slate-200 bg-white py-3 px-4 text-center text-sm font-bold text-slate-600 hover:border-[#1E388C] hover:text-[#1E388C] transition-all uppercase tracking-wider"
              >
                Koupit 1 lekci
              </Link>
            </div>
          </div>

          {/* KARTA 3: BALÍČEK - DOPORUČUJEME */}
          <div className="rounded-2xl border-2 border-[#1E388C] p-8 bg-white flex flex-col justify-between shadow-lg relative transform md:scale-[1.03] transition-all group">
            <span className="absolute -top-3.5 left-6 rounded-full bg-[#1E388C] text-white px-4 py-1 text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
              <Sparkles size={12} className="text-[#73C2BE]" /> Nejvýhodnější
            </span>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#73C2BE] uppercase tracking-widest block">Trvalé výsledky</span>
                <h3 className="text-2xl font-black text-[#1E388C] uppercase">Permanentka 10 vstupů</h3>
                <p className="text-xs text-slate-500">Intenzivní program pro redukci tuku a konec bolesti zad.</p>
              </div>
              
              <div className="flex items-baseline gap-1 py-2 border-t border-b border-slate-100">
                <span className="text-5xl font-black text-[#1E388C]">6 900</span>
                <span className="text-xl font-bold text-[#1E388C]">Kč</span>
                <span className="text-xs text-[#2986BF] font-bold ml-2">(690 Kč / lekce)</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#1E388C] shrink-0 mt-0.5" />
                  <span>10x plnohodnotný 20minutový EMS trénink</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#1E388C] shrink-0 mt-0.5" />
                  <span>Pravidelné kontrolní měření na InBody zdarma</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#1E388C] shrink-0 mt-0.5" />
                  <span>Prémiový all-inclusive servis studia</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#1E388C] shrink-0 mt-0.5" />
                  <span>Garantovaná platnost permanentky 6 měsíců</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-[#1E388C] shrink-0 mt-0.5" />
                  <span>Možnost převodu zbývajících vstupů na jinou osobu</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link 
                href="/rezervace" 
                className="block w-full rounded-xl bg-[#1E388C] py-4 px-4 text-center text-sm font-black text-white hover:bg-[#2986BF] transition-all shadow-md hover:shadow-xl hover:shadow-[#1E388C]/20 uppercase tracking-wider"
              >
                Chci začít proměnu
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* --- INFORMATIVNÍ SEO BLOK: CO JE VŽDY V CENĚ --- */}
      <section className="bg-slate-50 border-t border-b border-slate-100 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E388C] uppercase tracking-tight">
              Co u nás máte vždy v ceně lekce?
            </h2>
            <p className="text-slate-500 font-medium">
              Zakládáme si na férovém přístupu. U nás se nemusíte starat o žádné skryté poplatky nebo příplatky.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-sm">
            <div className="bg-white p-6 rounded-xl border border-slate-100 flex gap-4">
              <div className="text-[#2986BF] mt-1"><Award size={20} /></div>
              <div>
                <h4 className="font-bold text-[#1E388C] text-base mb-1">Osobní certifikovaný trenér</h4>
                <p className="text-slate-600 leading-relaxed text-xs">Celých 20 minut se trenér věnuje výhradně vám. Upravuje intenzitu impulzů podle pocitů a dohlíží na správné a bezpečné provedení cviků.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 flex gap-4">
              <div className="text-[#2986BF] mt-1"><CreditCard size={20} /></div>
              <div>
                <h4 className="font-bold text-[#1E388C] text-base mb-1">Půjčovné profi oblečení zdarma</h4>
                <p className="text-slate-600 leading-relaxed text-xs">Speciální funkční prádlo pod EMS vestu vám zapůjčíme na každou lekci dokonale čisté. Nemusíte s sebou nosit těžkou tašku na cvičení ani boty.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 flex gap-4">
              <div className="text-[#2986BF] mt-1"><Sparkles size={20} /></div>
              <div>
                <h4 className="font-bold text-[#1E388C] text-base mb-1">Pitný režim a hygiena</h4>
                <p className="text-slate-600 leading-relaxed text-xs">Před i po cvičení obdržíte iontový nápoj, vodu nebo kávu. K dispozici jsou čisté ručníky, sprchové gely, šampony i kvalitní deodoranty.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 flex gap-4">
              <div className="text-[#2986BF] mt-1"><Info size={20} /></div>
              <div>
                <h4 className="font-bold text-[#1E388C] text-base mb-1">Tělesná analýza a diagnostika</h4>
                <p className="text-slate-600 leading-relaxed text-xs">U stálých klientů pravidelně sledujeme data o složení těla (tuky, svaly, voda), abychom přesně monitorovali pokrok a nastavili správný režim.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ SEKCE (PRO SEO STRATEGII) --- */}
      <section className="py-20 px-6 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E388C] uppercase tracking-tight">
            Často kladené dotazy k platbám a rezervacím
          </h2>
          <div className="w-12 h-1 bg-[#73C2BE] mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200/60 space-y-2">
            <h4 className="font-bold text-[#1E388C] flex items-center gap-2 text-base">
              Jakým způsobem mohu v EMS studiu platit?
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Platby v našem studiu ve Znojmě momentálně probíhají **na místě v hotovosti**. Pokud potřebujete vystavit fakturu pro vašeho zaměstnavatele (např. platba z fondů FKSP, Benefit Plus apod.), napište nám prosím předem a rádi vám doklad vystavíme.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200/60 space-y-2">
            <h4 className="font-bold text-[#1E388C] flex items-center gap-2 text-base">
              Jaká je platnost permanentky na 10 vstupů?
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Platnost permanentky je plných **6 měsíců** od data nákupu. To vám dává dostatečnou flexibilitu i v případě dovolené nebo krátkodobé nemoci. Permanentka je navíc přenosná, takže ji můžete sdílet s partnerem nebo rodinou.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200/60 space-y-2">
            <h4 className="font-bold text-[#1E388C] flex items-center gap-2 text-base">
              Co se stane, když se nestihnu na trénink dostavit?
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Protože se osobní trenér rezervuje v daný čas výhradně pro vás, storno nebo změnu rezervace termínu přijímáme **nejpozději 24 hodin předem**. Při pozdějším zrušení termínu lekce bohužel propadá bez finanční náhrady.
            </p>
          </div>
        </div>
      </section>

      {/* --- SPODNÍ CTA BANNER --- */}
      <section className="bg-gradient-to-br from-[#1E388C] to-[#2986BF] text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#73C2BE]/20 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Ušetřete čas a získejte vysněnou postavu
          </h3>
          <p className="text-slate-100 text-sm opacity-90 max-w-md mx-auto">
            Objednejte se na svou první úvodní lekci s výraznou slevou a nechte si změřit stav vašeho těla.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/rezervace" 
              className="w-full sm:w-auto rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#1E388C] hover:bg-slate-50 transition-all uppercase tracking-wider shadow-md"
            >
              Rezervovat úvodní lekci
            </Link>
            <a 
              href="tel:777535302" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold border border-white/40 hover:border-white px-6 py-3.5 rounded-xl transition-all"
            >
              <Phone size={16} /> +420 777 535 302
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}