'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import Sidebar from '../../comp/Sidebar';
import { 
  CreditCard, 
  CheckCircle2, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  History,
  Coins,
  Lock,
  Sparkles,
  Phone
} from 'lucide-react';

interface CreditPackage {
  id: string;
  credits: number;
  title: string;
  priceCZK: number;
  pricePerCredit: number;
  badge?: string;
  savings?: string;
  popular?: boolean;
}

// Ceník pro standardní klienty (CLIENT)
const CLIENT_PACKAGES: CreditPackage[] = [
  {
    id: 'single',
    credits: 1,
    title: '1 lekce',
    priceCZK: 790,
    pricePerCredit: 790,
  },
  {
    id: 'pack-10',
    credits: 10,
    title: '10 lekcí',
    priceCZK: 6990,
    pricePerCredit: 699,
    badge: 'Nejoblíbenější',
    savings: 'Ušetříte 910 Kč',
    popular: true,
  },
  {
    id: 'pack-20',
    credits: 20,
    title: '20 lekcí',
    priceCZK: 12800,
    pricePerCredit: 640,
    badge: 'Nejvýhodnější',
    savings: 'Ušetříte 3 000 Kč',
  },
];

// Zvýhodněný ceník pro VIP, TRAINER, ADMIN atd.
const VIP_PACKAGES: CreditPackage[] = [
  {
    id: 'single',
    credits: 1,
    title: '1 lekce',
    priceCZK: 500,
    pricePerCredit: 500,
    badge: 'VIP cena',
  },
];

// Sjednocený seznam rolí s nárokem na VIP ceník
const VIP_ROLES = ['VIP', 'TRAINER', 'ADMIN', 'VIP_TRAINER', 'SWIMMER'];

const isVipRole = (role?: string) => {
  if (!role) return false;
  return VIP_ROLES.includes(role.toUpperCase());
};

export default function KredityPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ id: string; email?: string; full_name?: string; credit_balance: number; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Určení balíčků podle role načteného profilu
  const isVip = isVipRole(profile?.role);
  const currentPackages = isVip ? VIP_PACKAGES : CLIENT_PACKAGES;

  // Výchozí balíček (inicializuje se prvním platným balíčkem)
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CLIENT_PACKAGES[1]);

  // Při načtení/změně profilu se automaticky vybere odpovídající balíček ze zobrazené sady
  useEffect(() => {
    if (profile) {
      const packages = isVipRole(profile.role) ? VIP_PACKAGES : CLIENT_PACKAGES;
      // Bezpečný výběr balíčku (pokud VIP obsahuje méně položek)
      setSelectedPackage(packages[1] || packages[0]);
    }
  }, [profile?.role]);

  const loadUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/prihlaseni');
        return;
      }

      // Načtení profilu s použitím first_name a last_name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, credit_balance, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Chyba při načítání profilu:', profileError);
      }

      if (profileData) {
        const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
        setProfile({
          id: profileData.id,
          full_name: fullName || user.email,
          credit_balance: profileData.credit_balance,
          role: profileData.role,
          email: user.email,
        });
      }

      // Načtení historie kreditních transakcí
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

  // Zahájení platby přes GoPay
  const handleGoPayPayment = async () => {
    if (!profile || !selectedPackage) return;

    setProcessingPayment(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/payments/gopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.id,
          userEmail: profile.email,
          packageId: selectedPackage.id,
          credits: selectedPackage.credits,
          amountCZK: selectedPackage.priceCZK,
          packageName: selectedPackage.title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Nepodařilo se vytvořit platební požadavek.');
      }

      if (data.gw_url) {
        window.location.href = data.gw_url;
      } else {
        throw new Error('Nebyla doručena URL platební brány.');
      }
    } catch (err: any) {
      console.error('Chyba při platbě GoPay:', err);
      setErrorMessage(err.message || 'Při zakládání platby došlo k chybě. Zkuste to prosím znovu.');
      setProcessingPayment(false);
    }
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
        
        {/* Hlavička & Stav kreditů */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <Coins className="w-4 h-4" /> Dobíjení kreditů 
                {isVip && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Zvýhodněné ceníky ({profile?.role})
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Nákup kreditních balíčků</h1>
              <p className="text-slate-400 text-sm mt-1">
                Kredity slouží k okamžité rezervaci lekcí a tréninků. Platba probíhá online přes platební bránu GoPay.
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

        {/* Upozornění na brzké spuštění platební brány */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-950">Online platební brána bude brzy zprovozněna</h3>
              <p className="text-sm text-amber-800/90 mt-0.5 leading-relaxed">
                Na spuštění automatických online plateb pracujeme. Kredity a balíčky lekcí si zatím můžete pohodlně objednat telefonicky na naší lince.
              </p>
            </div>
          </div>
          <a
            href="tel:+420777535302"
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-5 py-3 rounded-xl transition shadow-md shadow-amber-600/15 shrink-0 w-full sm:w-auto text-sm"
          >
            <Phone className="w-4 h-4" /> Objednat telefonicky
          </a>
        </div>

        {/* Chybová hláška */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Výběr balíčku */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              1. Vyberte si balíček lekcí
            </h2>
            <span className="text-xs text-slate-500 font-medium">1 kredit = 1 lekce</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentPackages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
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
                        <span className="text-3xl font-black text-slate-900">{pkg.title}</span>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">({pkg.credits} {pkg.credits === 1 ? 'kredit' : 'kreditů'})</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="space-y-1 mb-6">
                      <div className="text-3xl font-black text-slate-900">
                        {pkg.priceCZK.toLocaleString('cs-CZ')} Kč
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        ({pkg.pricePerCredit.toLocaleString('cs-CZ')} Kč / lekce)
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
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Okamžité připsání po zaplacení
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Platba přes GoPay */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                2. Zaplatit online přes bránu GoPay
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rychlá a bezpečná platba kartou, Apple Pay, Google Pay nebo online bankovním převodem.
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Zabezpečeno GoPay</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Shrnutí objednávky</span>
              <div className="text-lg font-bold text-slate-900">
                {selectedPackage?.title} ({selectedPackage?.credits} kreditů)
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {selectedPackage?.priceCZK.toLocaleString('cs-CZ')} Kč
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              

              <button
                
                disabled={processingPayment || !selectedPackage}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 inline-flex items-center justify-center gap-3 w-full sm:w-auto text-base"
              >
                {processingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Přesměrovávám na GoPay...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" /> Zaplatit {selectedPackage?.priceCZK.toLocaleString('cs-CZ')} Kč
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3 text-center sm:text-left">
              Podporované způsoby platby
            </span>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                💳 Platba kartou (Visa / Mastercard)
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                🍏 Apple Pay
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                G Pay (Google Pay)
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                🏦 Rychlý bankovní převod
              </div>
            </div>
          </div>
        </div>

        {/* Historie kreditů */}
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
                    <p className="font-medium text-slate-900">{tx.description || 'Nákup kreditů'}</p>
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

        {/* Pata */}
        <div className="text-center text-xs text-slate-400 space-y-1 pt-4 border-t border-slate-200">
          <p>Online platby zajišťuje platební brána **GoPay** (GOPAY s.r.o.). Pro rychlé dobití lze rovněž využít telefonickou objednávku.</p>
          <p>Platby probíhají v souladu s <Link href="/obchodni-podminky" className="underline hover:text-slate-600">Obchodními podmínkami</Link> a podléhají ochraně osobních údajů.</p>
        </div>

      </main>
    </div>
  );
}