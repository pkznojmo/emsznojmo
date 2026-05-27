'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../comp/Sidebar'; 
import { supabase } from '../../lib/supabase';

// --- INTERFACES ---
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  address: string | null;
  clothing_size: string;
  goals: string | null;
  customer_note?: string | null;
  role: string;
}

interface Measurement {
  id: string;
  measured_at: string;
  height: number | null;
  weight: number | null;
  body_fat: number | null;
  muscles: number | null;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  biceps_left: number | null;
  biceps_right: number | null;
  thigh_left: number | null;
  thigh_right: number | null;
  calf_left: number | null;
  calf_right: number | null;
  shoulders: number | null;
}

// --- NEXT-GEN ADVANCED TELEMETRY VISUALIZER ---
const NextGenBodyVisualizer = ({ measData }: { measData: Partial<Record<keyof Measurement, string>> }) => {
  const parseVal = (val: string | undefined, fallback: number): number => {
    return val && !isNaN(parseFloat(val)) ? parseFloat(val) : fallback;
  };

  const height = parseVal(measData.height, 175);
  const weight = parseVal(measData.weight, 75);
  const fat = parseVal(measData.body_fat, 16);
  const muscle = parseVal(measData.muscles, 40);
  const shoulders = parseVal(measData.shoulders, 110);
  const chest = parseVal(measData.chest, 96);
  const waist = parseVal(measData.waist, 82);
  const hips = parseVal(measData.hips, 96);
  const bicepsL = parseVal(measData.biceps_left, 32);
  const bicepsR = parseVal(measData.biceps_right, 32);
  const thighL = parseVal(measData.thigh_left, 54);
  const thighR = parseVal(measData.thigh_right, 54);
  const calfL = parseVal(measData.calf_left, 37);
  const calfR = parseVal(measData.calf_right, 37);

  // Proporce a měřítka
  const shW = Math.max(25, Math.min(55, (shoulders / 110) * 38));
  const chW = Math.max(22, Math.min(50, (chest / 96) * 32));
  const wW = Math.max(16, Math.min(48, (waist / 82) * 26));
  const hW = Math.max(20, Math.min(48, (hips / 96) * 28));

  const bellyBulge = Math.max(0, (waist - 80) * 0.4) + Math.max(0, (fat - 18) * 0.8);

  const aL = Math.max(5, Math.min(18, (bicepsL / 32) * 8));
  const aR = Math.max(5, Math.min(18, (bicepsR / 32) * 8));
  const tL = Math.max(8, Math.min(24, (thighL / 54) * 13));
  const tR = Math.max(8, Math.min(24, (thighR / 54) * 13));
  const cL = Math.max(6, Math.min(16, (calfL / 37) * 9));
  const cR = Math.max(6, Math.min(16, (calfR / 37) * 9));

  // Stav kondice
  let statusText = "Normální kondice";
  let statusColor = "bg-gray-100 text-gray-700 border-gray-300";
  let isMuscular = muscle > 43 && fat < 18;

  if (fat > 24) {
    statusText = "Zvýšený podíl tuku (Redukce)";
    statusColor = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (isMuscular) {
    statusText = "Atletická / Svalová dominance";
    statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse";
  } else if (fat < 10 && muscle < 35) {
    statusText = "Astenický typ (Anabolizace)";
    statusColor = "bg-blue-50 text-blue-700 border-blue-200";
  }

  const gradientStart = isMuscular ? '#047857' : '#10b981';
  const gradientEnd = isMuscular ? '#064e3b' : '#34d399';

  return (
    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md max-w-[220px] mx-auto">
      {/* Pozadí s jemnými linkami */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] opacity-20 pointer-events-none"></div>
      
      {/* Status badge */}
      <div className={`mb-4 px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded-full ${statusColor} z-10 transition-all`}>
        {statusText}
      </div>

      {/* Hlavní SVG postava */}
      <svg 
        viewBox="0 0 200 400" 
        className="w-full max-w-[200px] h-auto filter drop-shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all duration-700 ease-out z-10"
      >
        <defs>
          <linearGradient id="premiumBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={isMuscular ? "4" : "1"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glowEffect)">
          {/* Hlava */}
          <circle cx="100" cy="42" r="20" fill="url(#premiumBodyGrad)" />
          {/* Krk */}
          <rect x="93" y="58" width="14" height="14" rx="3" fill="url(#premiumBodyGrad)" />

          {/* Tělo - organická křivka */}
          <path 
            d={`
              M ${100 - shW} 72 
              Q 100 68 ${100 + shW} 72 
              Q ${100 + chW} 105 ${100 + wW + bellyBulge} 145 
              Q 100 ${155 + bellyBulge * 0.3} ${100 - wW - bellyBulge} 145 
              Q ${100 - chW} 105 ${100 - shW} 72 Z
            `}
            fill="url(#premiumBodyGrad)"
            className="transition-all duration-700"
          />

          {/* Boky / Pánve */}
          <path 
            d={`
              M ${100 - wW - bellyBulge} 144
              Q 100 140 ${100 + wW + bellyBulge} 144
              L ${100 + hW} 175
              L ${100 - hW} 175 Z
            `}
            fill="url(#premiumBodyGrad)"
            className="transition-all duration-700"
          />

          {/* Levé rameno */}
          <path 
            d={`
              M ${100 - shW} 76
              Q ${100 - shW - aL - 4} 115 ${100 - wW - aL - 2} 155
              A ${aL} ${aL} 0 0 0 ${100 - wW - 2} 155
              Q ${100 - shW + 4} 115 ${100 - shW + 10} 78 Z
            `}
            fill="url(#premiumBodyGrad)"
            className="transition-all duration-700"
          />

          {/* Pravé rameno */}
          <path 
            d={`
              M ${100 + shW} 76
              Q ${100 + shW + aR + 4} 115 ${100 + wW + aR + 2} 155
              A ${aR} ${aR} 0 0 1 ${100 + wW + 2} 155
              Q ${100 + shW - 4} 115 ${100 + shW - 10} 78 Z
            `}
            fill="url(#premiumBodyGrad)"
            className="transition-all duration-700"
          />

          {/* Levé stehno */}
          <path 
            d={`
              M ${100 - hW + 2} 175
              Q ${100 - hW - tL * 0.3} 240 ${100 - hW/2 - cL * 0.5} 330
              A ${cL * 0.8} ${cL * 0.8} 0 0 0 ${100 - hW/2 + cL * 0.5} 330
              Q ${100 - 15} 240 ${100 - 3} 176 Z
            `}
            fill="url(#premiumBodyGrad)"
            className="transition-all duration-700"
          />

          {/* Pravé stehno */}
          <path 
            d={`
              M ${100 + hW - 2} 175
              Q ${100 + hW + tR * 0.3} 240 ${100 + hW/2 + cR * 0.5} 330
              A ${cR * 0.8} ${cR * 0.8} 0 0 1 ${100 + hW/2 - cR * 0.5} 330
              Q ${100 + 15} 240 ${100 + 3} 176 Z
            `}
            fill="url(#premiumBodyGrad)"
            className="transition-all duration-700"
          />

          {/* Svaly - reaguje na % tuku a svalů */}
          <g style={{
            opacity: fat < 22 ? Math.min(0.8, (muscle / 30) - 0.8) : 0,
            transition: 'opacity 0.7s ease-out'
          }}>
            {/* Prsa */}
            <path d="M 100 80 L 100 112" stroke="#044e37" strokeWidth="1.5" fill="none" opacity="0.6" />
            <path d={`M ${100 - chW * 0.6} 104 Q 100 114 ${100 + chW * 0.6} 104`} stroke="#044e37" strokeWidth="2" fill="none" opacity="0.7" />
            {/* Břišní svaly */}
            <g style={{ opacity: bellyBulge > 8 ? 0 : 1, transition: 'opacity 0.5s' }}>
              <line x1="100" y1="112" x2="100" y2="148" stroke="#044e37" strokeWidth="1.5" opacity="0.6" />
              <line x1="90" y1="122" x2="110" y2="122" stroke="#044e37" strokeWidth="1.5" opacity="0.4" />
              <line x1="92" y1="133" x2="108" y2="133" stroke="#044e37" strokeWidth="1.5" opacity="0.4" />
              <line x1="94" y1="144" x2="106" y2="144" stroke="#044e37" strokeWidth="1.5" opacity="0.4" />
            </g>
          </g>
        </g>
      </svg>

      {/* Ukázka telemetrických dat */}
      <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-400 z-10">
        <div>
          <span className="block text-[10px] font-bold text-slate-500 uppercase">Svalový Index</span>
          <span className="font-mono text-emerald-400 font-bold">{muscle} %</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-500 uppercase">Tuková Tkáň</span>
          <span className="font-mono text-amber-400 font-bold">{fat} %</span>
        </div>
      </div>
    </div>
  );
};

// --- HLAVNÍ STRÁNKA ---
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [editData, setEditData] = useState({ 
    first_name: '', 
    last_name: '', 
    phone: '', 
    address: '',
    goals: '', 
    customer_note: '' 
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measLoading, setMeasLoading] = useState(false);
  const [measMessage, setMeasMessage] = useState('');
  const [measData, setMeasData] = useState<Partial<Record<keyof Measurement, string>>>({
    height: '', weight: '', body_fat: '', muscles: '', waist: '', hips: '', 
    chest: '', biceps_left: '', biceps_right: '', thigh_left: '', thigh_right: '',
    calf_left: '', calf_right: '', shoulders: ''
  });

  const fetchData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      router.push('/prihlaseni');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setEditData({ 
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '', 
        address: profileData.address || '',
        goals: profileData.goals || '', 
        customer_note: profileData.customer_note || '' 
      });
    }

    const { data: measDataFromDB } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('measured_at', { ascending: false })
      .limit(5);

    if (measDataFromDB) {
      setMeasurements(measDataFromDB);
      if (measDataFromDB.length > 0) {
        const last = measDataFromDB[0];
        const formattedLast: Partial<Record<keyof Measurement, string>> = {};
        Object.keys(last).forEach(key => {
          const val = last[key as keyof Measurement];
          formattedLast[key as keyof Measurement] = val !== null && val !== undefined ? String(val) : '';
        });
        setMeasData(formattedLast);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Neuvedeno';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/prihlaseni');
    router.refresh();
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    setPasswordLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/obnova-hesla`,
    });
    setPasswordMessage(error 
      ? { text: `Chyba: ${error.message}`, isError: true } 
      : { text: 'E-mail odeslán!', isError: false }
    );
    setPasswordLoading(false);
  };

  const saveFieldRealTime = async (fieldName: keyof typeof editData) => {
    if (!profile) return;
    setActiveField(null);
    if (profile[fieldName as keyof UserProfile] === editData[fieldName]) return;

    const { error } = await supabase
      .from('profiles')
      .update({ [fieldName]: editData[fieldName] })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, [fieldName]: editData[fieldName] });
    } else {
      setEditData(prev => ({ ...prev, [fieldName]: (profile[fieldName as keyof UserProfile] as string) || '' }));
      alert(`Chyba při ukládání: ${error.message}`);
    }
  };

  const handleMeasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setMeasLoading(true);
    setMeasMessage('');
    const payload: any = { user_id: profile.id };
    Object.keys(measData).forEach(key => {
      const val = measData[key as keyof typeof measData];
      if (val && val.trim() !== '') payload[key] = parseFloat(val);
    });
    const { error } = await supabase.from('body_measurements').insert([payload]);
    if (error) {
      setMeasMessage(`Chyba: ${error.message}`);
    } else {
      setMeasMessage('Míry uloženy! 🎉');
      fetchData();
    }
    setMeasLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 font-medium">Načítám klientskou zónu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Hlavní obsah */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto w-full">
        {/* Hlavička */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ahoj, {profile?.first_name || 'Kliente'}! 👋</h1>
            <p className="text-gray-500 mt-1 text-sm">Vítej ve své EMS klientské zóně. Poklepáním (double click) na údaje profilu je rovnou upravíš.</p>
          </div>
          
          {/* Tlačítko pro reset hesla */}
          <div className="relative">
            <button
              onClick={handlePasswordReset}
              disabled={passwordLoading}
              className="text-xs bg-white border border-gray-300 font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              {passwordLoading ? 'Odesílám...' : 'Změnit přístupové heslo'}
            </button>
            {passwordMessage.text && (
              <p className={`absolute right-0 mt-1 text-xs font-medium ${passwordMessage.isError ? 'text-red-600' : 'text-emerald-600'}`}>
                {passwordMessage.text}
              </p>
            )}
          </div>
        </header>

        {/* Tři sloupce */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profilová karta */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit max-h-[600px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">Osobní profil</h3>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-semibold uppercase tracking-wider">
                Real-time
              </span>
            </div>
            <div className="space-y-4 text-sm">
              {/* Jméno a Příjmení */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Jméno</p>
                  <p className="font-semibold text-gray-400 italic bg-gray-50/50 p-1.5 rounded-lg">{profile?.first_name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Příjmení</p>
                  <p className="font-semibold text-gray-400 italic bg-gray-50/50 p-1.5 rounded-lg">{profile?.last_name || '—'}</p>
                </div>
              </div>
              {/* E-mail (nelze měnit) */}
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">E-mail (nelze měnit)</p>
                <p className="font-semibold text-gray-400 italic bg-gray-50/50 p-1.5 rounded-lg select-all">{profile?.email}</p>
              </div>
              {/* Telefon */}
              <div onDoubleClick={() => setActiveField('phone')}>
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Telefon</p>
                {activeField === 'phone' ? (
                  <input
                    autoFocus
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    onBlur={() => saveFieldRealTime('phone')}
                    onKeyDown={(e) => e.key === 'Enter' && saveFieldRealTime('phone')}
                    className="w-full border border-emerald-500 rounded px-2 py-1 outline-none bg-emerald-50/50"
                  />
                ) : (
                  <p className="font-semibold text-gray-700 cursor-pointer hover:text-emerald-600 transition">{profile?.phone || '—'}</p>
                )}
              </div>
              {/* Adresa */}
              <div onDoubleClick={() => setActiveField('address')}>
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Adresa bydliště</p>
                {activeField === 'address' ? (
                  <input
                    autoFocus
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    onBlur={() => saveFieldRealTime('address')}
                    onKeyDown={(e) => e.key === 'Enter' && saveFieldRealTime('address')}
                    className="w-full border border-emerald-500 rounded px-2 py-1 outline-none bg-emerald-50/50"
                  />
                ) : (
                  <p className="font-semibold text-gray-700 cursor-pointer hover:text-emerald-600 transition">{profile?.address || 'Klikněte dvakrát pro zadání adresy'}</p>
                )}
              </div>
              {/* Datum narození */}
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Datum narození</p>
                <p className="font-semibold text-gray-400 italic bg-gray-50/50 p-1.5 rounded-lg">{formatDate(profile?.birth_date)}</p>
              </div>
              {/* Cíle */}
              <div onDoubleClick={() => setActiveField('goals')}>
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Moje Cíle</p>
                {activeField === 'goals' ? (
                  <textarea
                    autoFocus
                    value={editData.goals}
                    onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                    onBlur={() => saveFieldRealTime('goals')}
                    className="w-full border border-emerald-500 rounded-lg p-2 mt-1 text-sm outline-none bg-emerald-50/50"
                    rows={3}
                  />
                ) : (
                  <p className="italic text-gray-600 bg-gray-50 p-2 rounded-lg min-h-[40px] cursor-pointer hover:bg-emerald-50/40 border border-transparent hover:border-emerald-200 transition">
                    {profile?.goals || 'Zatím bez cílů. Poklepej sem a napiš je.'}
                  </p>
                )}
              </div>
              {/* Poznámky */}
              <div onDoubleClick={() => setActiveField('customer_note')}>
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Moje Poznámky</p>
                {activeField === 'customer_note' ? (
                  <textarea
                    autoFocus
                    value={editData.customer_note}
                    onChange={(e) => setEditData({ ...editData, customer_note: e.target.value })}
                    onBlur={() => saveFieldRealTime('customer_note')}
                    className="w-full border border-emerald-500 rounded-lg p-2 mt-1 text-sm outline-none bg-emerald-50/50"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-600 bg-gray-50 p-2 rounded-lg min-h-[40px] cursor-pointer hover:bg-emerald-50/40 border border-transparent hover:border-emerald-200 transition">
                    {profile?.customer_note || 'Žádné interní poznámky.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Interaktivní formulář s Panáčkem */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 text-lg mb-2">Zadat nové měření</h3>
            <p className="text-xs text-gray-400 mb-6">Zadejte zjištěné hodnoty. 3D-skener siluety reaguje okamžitě na jakoukoliv změnu v centimetrech nebo tělesném složení.</p>
            <form onSubmit={handleMeasSubmit} className="space-y-6">
              {/* Hlavní parametry */}
              <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 border border-gray-100">
                <Input label="Výška (cm)" name="height" value={measData.height} onChange={setMeasData} />
                <Input label="Váha (kg)" name="weight" value={measData.weight} onChange={setMeasData} />
                <Input label="Tuk (%)" name="body_fat" value={measData.body_fat} onChange={setMeasData} />
                <Input label="Svaly (%)" name="muscles" value={measData.muscles} onChange={setMeasData} />
              </div>

              {/* Biometrická mapa a Panáček */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                {/* Levá strana */}
                <div className="md:col-span-4 space-y-4">
                  <Input label="Ramena (cm)" name="shoulders" value={measData.shoulders} onChange={setMeasData} />
                  <Input label="Hrudník (cm)" name="chest" value={measData.chest} onChange={setMeasData} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="L. Paže (cm)" name="biceps_left" value={measData.biceps_left} onChange={setMeasData} />
                    <Input label="P. Paže (cm)" name="biceps_right" value={measData.biceps_right} onChange={setMeasData} />
                  </div>
                  <Input label="Pas (cm)" name="waist" value={measData.waist} onChange={setMeasData} />
                </div>
                {/* Panáček */}
                <div className="md:col-span-4 space-y-2">
                  <NextGenBodyVisualizer measData={measData} />
                </div>
                {/* Pravá strana */}
                <div className="md:col-span-4 space-y-4">
                  <Input label="Boky (cm)" name="hips" value={measData.hips} onChange={setMeasData} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="L. Stehno (cm)" name="thigh_left" value={measData.thigh_left} onChange={setMeasData} />
                    <Input label="P. Stehno (cm)" name="thigh_right" value={measData.thigh_right} onChange={setMeasData} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="L. Lýtko (cm)" name="calf_left" value={measData.calf_left} onChange={setMeasData} />
                    <Input label="P. Lýtko (cm)" name="calf_right" value={measData.calf_right} onChange={setMeasData} />
                  </div>
                </div>
              </div>
              {/* Odeslání */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={measLoading}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
                >
                  {measLoading ? 'Ukládám do databáze...' : 'Uložit měření'}
                </button>
                {measMessage && (
                  <p className="text-center text-emerald-600 text-xs mt-2 font-bold bg-emerald-50 py-2 rounded-lg">
                    {measMessage}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// Pomocná komponenta pro vstupní pole
function Input({ label, name, value, onChange }: { label: string; name: string; value: string | undefined; onChange: React.Dispatch<React.SetStateAction<Partial<Record<keyof Measurement, string>>>> }) {
  return (
    <div>
      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        step="0.1"
        name={name}
        value={value || ''}
        onChange={(e) => onChange((prev) => ({ ...prev, [name]: e.target.value }))}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:bg-white focus:border-emerald-500 outline-none transition shadow-sm font-mono"
      />
    </div>
  );
}