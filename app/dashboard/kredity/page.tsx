/*
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase'; // upravte cestu dle projektu
import Sidebar from '../../comp/Sidebar';
import { 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  History,
  ArrowRight,
  Clock,
  Coins
} from 'lucide-react';

const BANK_ACCOUNT_NUMBER = "131-3604330207";
const BANK_CODE = "0100";
const IBAN = "CZ2801000001313604330207";

interface CreditPackage {
  id: string;
  credits: number;
  priceCZK: number;
  pricePerCredit: number;
  badge?: string;
  savings?: string;
  popular?: boolean;
}

// Ceník pro standardní klienty (Client)
const CLIENT_PACKAGES: CreditPackage[] = [
  {
    id: 'single',
    credits: 1,
    priceCZK: 790,
    pricePerCredit: 790,
  },
  {
    id: 'pack-10',
    credits: 10,
    priceCZK: 6990,
    pricePerCredit: 699,
    badge: 'Nejoblíbenější',
    savings: 'Ušetříte 910 Kč',
    popular: true,
  },
  {
    id: 'pack-20',
    credits: 20,
    priceCZK: 12800,
    pricePerCredit: 640,
    badge: 'Nejvýhodnější',
    savings: 'Ušetříte 3 000 Kč',
  },
];

// Zvýhodněný ceník pro Swimmer & Trainer (300 Kč / 1 kredit)
const MEMBER_PACKAGES: CreditPackage[] = [
  {
    id: 'single',
    credits: 1,
    priceCZK: 300,
    pricePerCredit: 300,
  },
  {
    id: 'pack-10',
    credits: 10,
    priceCZK: 3000,
    pricePerCredit: 300,
    badge: 'Členská cena',
    popular: true,
  },
  {
    id: 'pack-20',
    credits: 20,
    priceCZK: 6000,
    pricePerCredit: 300,
    badge: 'Členská cena',
  },
];

export default function KredityPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ id: string; birth_number: string | null; credit_balance: number; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CLIENT_PACKAGES[1]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Určení balíčků podle role
  const isMember = profile?.role === 'SWIMMER' || profile?.role === 'TRAINER';
  const currentPackages = isMember ? MEMBER_PACKAGES : CLIENT_PACKAGES;

  const loadUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/prihlaseni');
        return;
      }

      // 1. Načtení profilu VČETNĚ ROLI (role)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, birth_number, credit_balance, role')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // Nastavení výchozího balíčku podle role
        const isUserMember = profileData.role === 'Swimmer' || profileData.role === 'Trainer';
        setSelectedPackage(isUserMember ? MEMBER_PACKAGES[1] : CLIENT_PACKAGES[1]);
      }

      // 2. Načtení historie transakcí
      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txData) {
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Chyba při načítání dat uživatele:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/prihlaseni');
    router.refresh();
  };

  const handleCreatePayment = async () => {
    if (!profile || !profile.birth_number) return;

    setCreatingOrder(true);
    try {
      const { data: order, error } = await supabase
        .from('payment_orders')
        .insert({
          user_id: profile.id,
          variable_symbol: profile.birth_number,
          amount_czk: selectedPackage.priceCZK,
          credits_to_add: selectedPackage.credits,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      setActiveOrder(order);
    } catch (err: any) {
      alert('Nepodařilo se vygenerovat platební příkaz: ' + err.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getSPDString = (amount: number, vs: string, credits: number) => {
    let label = 'vstupů';
    if (credits === 1) label = 'vstup';
    else if (credits >= 2 && credits <= 4) label = 'vstupy';

    const msg = `${credits} ${label} na cvičení`;
    return `SPD*1.0*ACC:${IBAN}*AM:${amount}.00*CC:CZK*X-VS:${vs}*MSG:${msg}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-medium text-sm">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        Načítám klientskou zónu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row text-gray-900">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-5xl mx-auto overflow-y-auto w-full space-y-8 pb-24 md:pb-12">
        
        }
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <Coins className="w-4 h-4" /> Klientská zóna {isMember && <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">Zvýhodněné členství ({profile?.role})</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Nákup kreditů</h1>
              <p className="text-slate-400 text-sm mt-1">
                Kredity slouží k rezervaci tréninků. Dobijte si účet bezpečně převodem.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-6 py-4 rounded-2xl flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-300 font-medium block">Váš zůstatek</span>
                <span className="text-3xl font-black text-emerald-400">{profile?.credit_balance ?? 0} <span className="text-lg font-normal text-white">kreditů</span></span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        }
        {!profile?.birth_number && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 text-amber-900">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-bold">Pro nákup kreditů chybí rodné číslo</h3>
              <p className="text-sm text-amber-800">
                Rodné číslo slouží jako váš unikátní variabilní symbol pro automatické párování plateb.
              </p>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
              >
                Doplnit rodné číslo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        }
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            1. Vyberte si balíček kreditů
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentPackages.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setActiveOrder(null);
                  }}
                  className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-200 border-2 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {pkg.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-sm ${
                      pkg.popular ? 'bg-emerald-600' : 'bg-slate-900'
                    }`}>
                      {pkg.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-4xl font-extrabold text-slate-900">{pkg.credits}</span>
                        <span className="text-slate-500 font-semibold ml-1.5">{pkg.credits === 1 ? 'kredit' : 'kreditů'}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="space-y-1 mb-6">
                      <div className="text-2xl font-black text-slate-900">
                        {pkg.priceCZK.toLocaleString('cs-CZ')} Kč
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        ({pkg.pricePerCredit} Kč / kredit)
                      </p>
                      {pkg.savings && (
                        <span className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                          {pkg.savings}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Platnost kreditů bez omezení
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Automatické připsání do pár minut
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        }
        {profile?.birth_number && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              2. Zaplaťte QR kódem nebo bankovním převodem
            </h2>

            {!activeOrder ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                <p className="text-slate-600 mb-4 font-medium">
                  Vybráno: <span className="font-bold text-slate-900">{selectedPackage.credits} kreditů</span> za <span className="font-bold text-slate-900">{selectedPackage.priceCZK.toLocaleString('cs-CZ')} Kč</span>
                </p>
                <button
                  onClick={handleCreatePayment}
                  disabled={creatingOrder}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {creatingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generuji QR kód...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" /> Generovat QR kód pro platbu
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Naskenujte v mobilním bankovnictví</span>
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                        getSPDString(
                          activeOrder.amount_czk, 
                          activeOrder.variable_symbol, 
                          activeOrder.credits_to_add || selectedPackage.credits
                        )
                      )}`}
                      alt="Platební QR Kód"
                      className="w-52 h-52 object-contain"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Standardní česká QR platba
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 text-sm">
                    <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Platbu zpracováváme automaticky. Kredity se vám připíšou do 15 minut po doručení platby do banky.</span>
                  </div>

                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs text-slate-400 font-sans block">Číslo účtu</span>
                        <span className="font-bold text-slate-900">{BANK_ACCOUNT_NUMBER} / {BANK_CODE}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`${BANK_ACCOUNT_NUMBER}/${BANK_CODE}`, 'account')}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        {copiedField === 'account' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-300 ring-2 ring-emerald-500/10">
                      <div>
                        <span className="text-xs text-emerald-600 font-sans font-bold block">Variabilní symbol (DŮLEŽITÉ)</span>
                        <span className="font-black text-slate-900 text-base">{activeOrder.variable_symbol}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(activeOrder.variable_symbol, 'vs')}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        {copiedField === 'vs' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs text-slate-400 font-sans block">Částka k úhradě</span>
                        <span className="font-bold text-slate-900">{activeOrder.amount_czk.toLocaleString('cs-CZ')} Kč</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(activeOrder.amount_czk.toString(), 'amount')}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" /> Historie pohybů kreditů
          </h2>

          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4">Zatím nemáte žádné pohyby kreditů.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{tx.description || 'Pohyb kreditů'}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString('cs-CZ', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`font-bold font-mono text-base ${
                    tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'
                  }`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
*/
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../comp/Sidebar';
import { supabase } from '../../../lib/supabase';
import { Construction } from 'lucide-react';

export default function KredityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/prihlaseni');
        return;
      }
    } catch (err) {
      console.error('Chyba při ověřování uživatele:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/prihlaseni');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-medium text-sm">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        Načítám...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row text-gray-900">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-5xl mx-auto flex items-center justify-center w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center max-w-lg w-full space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Construction className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Stránka je ve vývoji</h1>
          <p className="text-slate-500 text-sm">
            Tato sekce se pro vás připravuje. Brzy zde bude dostupná správa a nákup kreditů.
          </p>
        </div>
      </main>
    </div>
  );
}