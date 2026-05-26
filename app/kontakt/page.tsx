import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Calendar, ShieldCheck, Award, Heart, UserCheck } from 'lucide-react';

export default function ContactPage() {
  
  // Data pro 4 trenéry - připraveno pro snadné napojení fotek a textů
  const trainers = [
    {
      id: 1,
      name: "Mgr. David Křivan",
      role: "Certifikovaný trenér",
      specialization: "Ve vývoji",
      credo: "Ve vývoji",
      image: "" // Sem pak dáš reálnou fotku
    },
    {
      id: 2,
      name: "Ing. Monika Dufková",
      role: "Certifikovaná EMS trenérka",
      specialization: "Ve vývoji",
      credo: "Ve vývoji",
      image: "" // Sem pak dáš reálnou fotku
    },
    {
      id: 3,
      name: "Mgr. Pavel Dufek",
      role: "Certifikovaný EMS trenér",
      specialization: "Ve vývoji",
      credo: "Ve vývoji",
      image: "" 
    },
  ];

  return (
    <main className="bg-white min-h-screen text-slate-800 antialiased selection:bg-[#73C2BE]/30">
      
      {/* --- HERO / HLAVIČKA STRÁNKY (Full-width) --- */}
      <section className="w-full relative bg-gradient-to-b from-[#1E388C]/10 via-white to-white px-6 pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-[#73C2BE]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-[#1E388C] sm:text-5xl uppercase leading-tight">
              Kontakt & Náš tým
            </h1>
            <div className="w-16 h-1 bg-[#2986BF] mx-auto rounded-full"></div>
            <p className="text-lg text-slate-600 font-normal leading-relaxed">
              Kde nás najdete a s kým budete trénovat. Zakládáme si na osobním přístupu, rodinné atmosféře a špičkové odbornosti.
            </p>
          </div>
        </div>
      </section>

      {/* --- PR SEKCE: TRENÉŘI (Tady budujeme silné PR) --- */}
      <section className="w-full py-12 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#2986BF] uppercase tracking-widest block">Vaše vedení a opora</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E388C] uppercase tracking-tight">
              Kdo se o vás bude starat?
            </h2>
            <div className="w-12 h-1 bg-[#73C2BE] mx-auto rounded-full"></div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Všichni naši trenéři procházejí přísným certifikovaným školením pro EMS technologii. Zapomeňte na anonymní fitka – u nás cvičíte vždy pod dohledem profesionála, který zná vaše cíle.
            </p>
          </div>

          {/* Mřížka se 4 trenéry */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {trainers.map((trainer) => (
              <div 
                key={trainer.id} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group"
              >
                <div>
                  {/* Prostor pro fotku trenéra s jemným overlay efektem */}
                  <div className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={trainer.image} 
                      alt={trainer.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E388C]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Detaily a texty */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-black text-[#1E388C] text-lg leading-tight uppercase">{trainer.name}</h3>
                      <p className="text-xs font-bold text-[#2986BF]">{trainer.role}</p>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-start gap-1">
                      <Award size={14} className="text-[#73C2BE] shrink-0 mt-0.5" />
                      <span>{trainer.specialization}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic leading-relaxed pt-1">
                      &ldquo;{trainer.credo}&ldquo;
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="w-full border-t border-slate-100 pt-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E388C] uppercase tracking-wider bg-[#1E388C]/5 px-2.5 py-1 rounded-full">
                      <UserCheck size={12} className="text-[#73C2BE]" /> Provází lekcí
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* --- PRAKTICKÉ KONTAKTNÍ ÚDAJE + OTEVÍRACÍ DOBA (Full-width šedé pozadí) --- */}
      <section className="w-full bg-slate-50 border-t border-b border-slate-100 py-16 px-6">
        <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-2 items-start">
          
          {/* Kontaktní bloky */}
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#2986BF] uppercase tracking-widest block">Kde nás najdete</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E388C] uppercase tracking-tight">EMS Studio Znojmo</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Moderní, čisté a plně vybavené studio v širším centru Znojma. Parkování je možné v blízkosti studia.
              </p>
            </div>

            <div className="grid gap-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#1E388C] flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E388C] uppercase text-xs tracking-wider">Adresa Studia</h4>
                  <p className="text-slate-700 font-medium mt-0.5">Melkusova 44, 669 02 Znojmo</p>
                  <p className="text-slate-400 text-xs">(Tělocvična na bazénu Louka))</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#1E388C] flex items-center justify-center shrink-0 shadow-sm">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E388C] uppercase text-xs tracking-wider">Telefon</h4>
                  <a href="tel:777535302" className="text-slate-700 font-bold hover:text-[#2986BF] transition-colors mt-0.5 block text-base">
                    +420 777 535 302
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#1E388C] flex items-center justify-center shrink-0 shadow-sm">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E388C] uppercase text-xs tracking-wider">E-mail</h4>
                  <a href="mailto:info@pkznojmo.cz" className="text-slate-700 font-medium hover:text-[#2986BF] transition-colors mt-0.5 block">
                    info@pkznojmo.cz
                  </a>
                </div>
              </div>
            </div>

            {/* Provozní údaje pro fakturaci */}
            <div className="pt-4 border-t border-slate-200/60 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-500">Provozní informace:</p>
              <p>Provozovatel: Plavecký klub Znojmo z.s.</p>
              <p>IČO: </p>
            </div>
          </div>

          {/* Otevírací doba */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-[#1E388C]">
              <Clock size={20} className="text-[#2986BF]" />
              <h3 className="text-lg font-black uppercase tracking-tight">Otevírací doba</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Tréninky probíhají **výhradně na základě předchozí online nebo telefonické rezervace**, abychom pro vás garantovali přítomnost osobního trenéra a prázdné studio jen pro vás.
            </p>

            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-medium">Pondělí - Pátek</span>
                <span className="font-bold text-[#1E388C]">07:00 - 20:00</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-medium">Sobota</span>
                <span className="font-bold text-slate-600">08:00 - 14:00</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400">
                <span>Neděle & Svátky</span>
                <span className="italic text-xs font-semibold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">Zavřeno</span>
              </div>
            </div>

            <div className="bg-[#73C2BE]/10 border border-[#73C2BE]/20 rounded-xl p-4 text-xs text-slate-700 flex gap-2">
              <Heart size={16} className="text-[#1E388C] shrink-0 mt-0.5" />
              <span>Chcete specifický čas mimo otevírací dobu? Zavolejte nám a pokud to bude v silách našich trenérů, rádi vám vyjdeme vstříc.</span>
            </div>
          </div>

        </div>
      </section>

      {/* --- MAPA / CALL TO ACTION (Full-width modrý přechod) --- */}
      <section className="w-full bg-gradient-to-br from-[#1E388C] to-[#2986BF] text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#73C2BE]/20 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Vyberte si svého trenéra a začněte
            </h3>
            <p className="text-slate-100 text-sm opacity-90 max-w-md mx-auto">
              V rezervačním systému si můžete zvolit konkrétní čas, který vám vyhovuje nejvíce. Těšíme se na vás!
            </p>
            
            <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                href="/rezervace" 
                className="w-full sm:w-auto rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#1E388C] hover:bg-slate-50 transition-all uppercase tracking-wider shadow-md inline-flex items-center justify-center gap-2"
              >
                <Calendar size={16} /> Online rezervace tréninku
              </Link>
              <a 
                href="tel:777535302" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold border border-white/40 hover:border-white px-6 py-3.5 rounded-xl transition-all uppercase tracking-wider"
              >
                <Phone size={16} /> Zavolat hned
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}