import Link from 'next/link';
import { ArrowLeft, Check, Users, ShieldAlert, XCircle, ChevronRight, Phone, Calendar, HeartPulse } from 'lucide-react';

export default function ForWhomPage() {
  return (
    <main className="bg-white min-h-screen text-slate-800 antialiased selection:bg-[#73C2BE]/30">
      
      {/* --- HERO / HLAVIČKA STRÁNKY (Full-width pozadí) --- */}
      <section className="w-full relative bg-gradient-to-b from-[#1E388C]/10 via-white to-white px-6 pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-[#73C2BE]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-[#1E388C] sm:text-5xl uppercase leading-tight">
              Pro koho je EMS cvičení vhodné?
            </h1>
            <div className="w-16 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
            <p className="text-lg text-slate-600 font-normal leading-relaxed">
              EMS technologie je navržena pro každého, kdo chce efektivně investovat do svého těla. Ať už nestíháte kvůli práci, nebo se vracíte do formy po zranění.
            </p>
          </div>
        </div>
      </section>

      {/* --- HLAVNÍ CÍLOVÉ SKUPINY --- */}
      <section className="w-full py-16 px-6">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Skupina 1: Lidé s bolestmi zad */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-4 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="text-[#1E388C] font-black text-3xl opacity-20">01</div>
            <h3 className="text-xl font-bold text-[#1E388C] uppercase tracking-tight">Lidé s bolestmi zad</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trávíte hodiny u počítače nebo v autě? EMS impulzy pronikají hluboko do hlubokého stabilizačního systému (core) a posilují svaly kolem páteře, které běžným cvičením nelze aktivovat. Výsledkem je úleva již po několika lekcích.
            </p>
          </div>

          {/* Skupina 2: Vytížení manažeři a podnikatelé */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-4 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="text-[#1E388C] font-black text-3xl opacity-20">02</div>
            <h3 className="text-xl font-bold text-[#1E388C] uppercase tracking-tight">Časově vytížení</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nemáte čas trávit 4 hodiny týdně v posilovně? U nás vám stačí 20 minut týdně. Kompletně vás oblékneme, trénink pod vedením trenéra uteče jako voda a vy se můžete okamžitě vrátit ke své práci nebo rodině.
            </p>
          </div>

          {/* Skupina 3: Maminky po porodu */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-4 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="text-[#1E388C] font-black text-3xl opacity-20">03</div>
            <h3 className="text-xl font-bold text-[#1E388C] uppercase tracking-tight">Maminky po porodu</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              EMS dokáže bezpečně a velmi rychle zpevnit ochablé břišní svalstvo, pomáhá řešit diastázu (rozestup břišních svalů) a prokazatelně zpevňuje svaly pánevního dna, což je po porodu klíčové pro celkové zdraví.
            </p>
          </div>

          {/* Skupina 4: Lidé toužící po hubnutí */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-4 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="text-[#1E388C] font-black text-3xl opacity-20">04</div>
            <h3 className="text-xl font-bold text-[#1E388C] uppercase tracking-tight">Snaha o redukci tuku</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Během 20 minut EMS tréninku nastartujete metabolismus na maximum. Tělo spaluje kalorie ještě dalších 48 až 72 hodin po tréninku (tzv. afterburn efekt), což rapidně urychluje odbourávání podkožního tuku.
            </p>
          </div>

          {/* Skupina 5: Senioři a lidé po zranění */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-4 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="text-[#1E388C] font-black text-3xl opacity-20">05</div>
            <h3 className="text-xl font-bold text-[#1E388C] uppercase tracking-tight">Aktivní senioři a REHABABILITACE</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cvičení vůbec nezatěžuje klouby, šlachy ani vazy. Je proto ideální pro lidi po úrazech, s nadváhou nebo pro starší generaci, která si chce bezpečně udržet svalový tonus, sílu a zdravé kosti bez rizika zranění.
            </p>
          </div>

          {/* Skupina 6: Sportovci hledající progres */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-4 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="text-[#1E388C] font-black text-3xl opacity-20">06</div>
            <h3 className="text-xl font-bold text-[#1E388C] uppercase tracking-tight">Vrcholoví sportovci</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              I když pravidelně sportujete, vaše tělo si na zátěž zvykne. EMS představuje zcela nový typ stimulu pro svalová vlákna. Výrazně zvyšuje dynamiku, výbušnost a maximální sílu, což ocení běžci, cyklisté i hokejisté.
            </p>
          </div>

        </div>
      </section>

      {/* --- DUŽNATÁ SEKCE: KONTRAINDIKACE (Důležité a transparentní pro klienta, Full-width šedé pozadí) --- */}
      <section className="w-full bg-slate-50 border-t border-b border-slate-100 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E388C] uppercase tracking-tight flex items-center justify-center gap-2">
              <ShieldAlert size={26} className="text-[#2986BF]" /> Kdy EMS naopak vhodné není?
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto">
              Bezpečí našich klientů je pro nás ve Znojmě na prvním místě. Existují zdravotní stavy (kontraindikace), při kterých EMS cvičení bohužel nelze provádět.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm grid gap-6 sm:grid-cols-2 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Kardiostimulátor / defibrilátor</span>
                  <p className="text-slate-500 text-xs">Elektrické impulzy přístroje by mohly narušit správnou funkci srdečních podpor.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Těhotenství</span>
                  <p className="text-slate-500 text-xs">V těhotenství se EMS zásadně neprovádí. Naopak po porodu je velmi vyhledávané.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Epilepsie</span>
                  <p className="text-slate-500 text-xs">Vnější stimulace svalových nervů by mohla vyvolat záchvat.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Akutní bakteriální či virové onemocnění</span>
                  <p className="text-slate-500 text-xs">S horečkou, chřipkou nebo silným nachlazením trénink nikdy neabsolvujte.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Těžké neurologické poruchy</span>
                  <p className="text-slate-500 text-xs">A vážná onemocnění oběhové soustavy (např. těžká trombóza).</p>
                </div>
              </div>

              <div className="p-3 bg-[#2986BF]/5 rounded-xl border border-[#2986BF]/10 text-xs text-slate-600 flex gap-2">
                <HeartPulse size={16} className="text-[#2986BF] shrink-0 mt-0.5" />
                <span>Máte chronické onemocnění a nejste si jistí? Neváhejte nám zavolat, případně konzultujte cvičení se svým ošetřujícím lékařem.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- EXPERTNÍ RADA / FOOTER CALL TO ACTION (Full-width modrý přechod) --- */}
      <section className="w-full bg-gradient-to-br from-[#1E388C] to-[#2986BF] text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#73C2BE]/20 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Našli jste se v některé ze skupin?
            </h3>
            <p className="text-slate-100 text-sm opacity-90 max-w-md mx-auto">
              Nejlepší způsob, jak zjistit účinky EMS, je vyzkoušet si to na vlastní kůži při nezávazné úvodní lekci.
            </p>
            
            <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                href="/rezervace" 
                className="w-full sm:w-auto rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#1E388C] hover:bg-slate-50 transition-all uppercase tracking-wider shadow-md inline-flex items-center justify-center gap-2"
              >
                <Calendar size={16} /> Zarezervovat zkušební termín
              </Link>
              <Link 
                href="/o-ems" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 text-sm font-bold border border-white/30 hover:border-white px-6 py-3.5 rounded-xl transition-all uppercase tracking-wider"
              >
                Jak to funguje <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}