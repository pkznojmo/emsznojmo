'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import Sidebar from '../../comp/Sidebar';
import { 
  CreditCard, 
  CheckCircle2, 
  Check, 
  AlertCircle, 
  History,
  Coins,
  Lock,
  Sparkles,
  Shirt,
  ArrowRight,
  ShieldCheck as ShieldIcon,
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

interface CreditTransaction {
  id: string;
  amount: number;
  type: string | null;
  description: string | null;
  created_at: string;
}

interface GoPayCheckoutResult {
  id?: string | number;
}

interface GoPayCheckoutApi {
  checkout: (options: { gatewayUrl: string; inline: boolean }, callback: (result: GoPayCheckoutResult | null) => void) => void;
}

interface ClothingOrder {
  id: string;
  quantity: number;
  status: string;
  size: string;
  gopay_payment_id?: string | null;
  created_at: string;
}

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

const VIP_ROLES = ['VIP', 'TRAINER', 'ADMIN', 'VIP_TRAINER', 'SWIMMER'];
const TRANSACTION_PAGE_SIZE = 50;

const isVipRole = (role?: string) => {
  if (!role) return false;
  return VIP_ROLES.includes(role.toUpperCase());
};

// Vnitřní komponenta pracující s useSearchParams
function KredityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [profile, setProfile] = useState<{ id: string; email?: string; full_name?: string; credit_balance: number; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clothingOrders, setClothingOrders] = useState<ClothingOrder[]>([]);
  const [clothingInventory, setClothingInventory] = useState<{ size: string; stock: number }[]>([]);
  const [selectedClothingSize, setSelectedClothingSize] = useState('M');
  const [orderingClothing, setOrderingClothing] = useState(false);
  const [activeProduct, setActiveProduct] = useState<'credits' | 'clothing'>('credits');

  const isVip = isVipRole(profile?.role);
  const currentPackages = isVip ? VIP_PACKAGES : CLIENT_PACKAGES;
  const [selectedPackageId, setSelectedPackageId] = useState('pack-10');
  const selectedPackage = currentPackages.find((pkg) => pkg.id === selectedPackageId) || currentPackages[0];

  // Načtení GoPay Javascript API (embed.js)
  useEffect(() => {
    const scriptId = 'gopay-embed-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = process.env.NEXT_PUBLIC_GOPAY_ENV === 'production'
        ? 'https://gate.gopay.cz/gp-gw/js/embed.js'
        : 'https://gw.sandbox.gopay.com/gp-gw/js/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/prihlaseni');
        return;
      }

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

      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, TRANSACTION_PAGE_SIZE - 1);

      if (txData) {
        setTransactions(txData);
        setHasMoreTransactions(txData.length === TRANSACTION_PAGE_SIZE);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) {
        const orderResponse = await fetch('/api/clothing-orders', {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });
        const orderData = await orderResponse.json() as { orders?: ClothingOrder[]; inventory?: { size: string; stock: number }[] };
        if (orderResponse.ok) {
          setClothingOrders(orderData.orders || []);
          setClothingInventory(orderData.inventory || []);
        }
      }
    } catch (err) {
      console.error('Chyba při načítání dat uživatele:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadOlderTransactions = async () => {
    if (loadingMoreTransactions || !hasMoreTransactions) return;
    setLoadingMoreTransactions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(transactions.length, transactions.length + TRANSACTION_PAGE_SIZE - 1);
      if (error) throw error;
      const nextPage = data || [];
      setTransactions((current) => [...current, ...nextPage]);
      setHasMoreTransactions(nextPage.length === TRANSACTION_PAGE_SIZE);
    } catch (error) {
      console.error('Chyba při načítání starších pohybů kreditů:', error);
      setErrorMessage('Nepodařilo se načíst starší pohyby kreditů. Zkuste to znovu.');
    } finally {
      setLoadingMoreTransactions(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadUserData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUserData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/prihlaseni');
    router.refresh();
  };

  // Ověření stavu platby na backendu
  const verifyPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        setErrorMessage('Přihlášení vypršelo. Znovu se přihlaste a zkontrolujte stav platby.');
        return;
      }

      const res = await fetch(`/api/payments/gopay/status?id=${encodeURIComponent(paymentId)}`, {
        headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` },
      });
      const data = await res.json() as { state?: string; message?: string; productType?: string };

      if (!res.ok) {
        setErrorMessage(data.message || 'Nepodařilo se ověřit stav platby.');
        return;
      }

      if (data.state === 'PAID') {
        setSuccessMessage(data.productType === 'ems_clothing'
          ? 'Platba za EMS oblečení proběhla. Potvrzení jsme poslali e-mailem a objednávku si vyzvednete na další lekci EMS.'
          : 'Platba byla úspěšně provedena a kredity byly připsány na váš účet.');
        loadUserData();
      } else if (data.state === 'CANCELED') {
        setErrorMessage('Platba byla zrušena.');
      } else if (data.state) {
        setErrorMessage(`Stav platby: ${data.state}`);
      } else {
        setErrorMessage('Odpověď platební brány neobsahuje stav platby. Zkuste stránku obnovit.');
      }
    } catch (err) {
      console.error('Chyba při ověřování platby:', err);
      setErrorMessage('Nepodařilo se ověřit stav platby. Zkuste to prosím znovu.');
    }
  }, [loadUserData]);

  // Kontrola navrácení z platební brány přes GET parametr ?id=...
  const returnPaymentId = searchParams.get('id');
  useEffect(() => {
    if (!returnPaymentId) return;
    const timer = window.setTimeout(() => { void verifyPaymentStatus(returnPaymentId); }, 0);
    return () => window.clearTimeout(timer);
  }, [returnPaymentId, verifyPaymentStatus]);

  // Zahájení platby GoPay
  const handleGoPayPayment = async () => {
    if (!profile || !selectedPackage) return;

    setProcessingPayment(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Přihlášení vypršelo. Obnovte stránku a přihlaste se znovu.');
      }

      const response = await fetch('/api/payments/gopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ packageId: selectedPackage.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Nepodařilo se vytvořit platební požadavek.');
      }

      if (data.gw_url) {
        const goPay = (window as Window & { _gopay?: GoPayCheckoutApi })._gopay;
        if (goPay) {
          goPay.checkout(
            { gatewayUrl: data.gw_url, inline: true },
            async (checkoutResult) => {
              if (checkoutResult && checkoutResult.id) {
                await verifyPaymentStatus(String(checkoutResult.id));
              }
              setProcessingPayment(false);
            }
          );
        } else {
          window.location.assign(data.gw_url);
        }
      } else {
        throw new Error('Nebyla doručena URL platební brány.');
      }
    } catch (err: unknown) {
      console.error('Chyba při platbě GoPay:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Při zakládání platby došlo k chybě. Zkuste to prosím znovu.');
      setProcessingPayment(false);
    }
  };

  const handleOrderClothing = async () => {
    setOrderingClothing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData.session?.access_token) throw new Error('Přihlášení vypršelo. Přihlaste se znovu.');
      const response = await fetch('/api/payments/gopay', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionData.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: 'ems_clothing', size: selectedClothingSize }),
      });
      const data = await response.json() as { message?: string; id?: string | number; gw_url?: string };
      if (!response.ok || !data.gw_url) throw new Error(data.message || 'Nepodařilo se vytvořit platbu za oblečení.');
      const goPay = (window as Window & { _gopay?: GoPayCheckoutApi })._gopay;
      if (goPay) {
        goPay.checkout({ gatewayUrl: data.gw_url, inline: true }, async (checkoutResult) => {
          if (checkoutResult?.id) await verifyPaymentStatus(String(checkoutResult.id));
          setOrderingClothing(false);
          void loadUserData();
        });
      } else {
        window.location.assign(data.gw_url);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Objednávku se nepodařilo vytvořit.');
    } finally {
      setOrderingClothing(false);
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
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <Coins className="w-4 h-4" /> EMS ZNOJMO · OBCHOD
                {isVip && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Zvýhodněné ceníky ({profile?.role})
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Vybavení pro váš trénink</h1>
              <p className="text-slate-400 text-sm mt-1">
                Vyberte si kreditní balíček nebo EMS oblečení. Bezpečnou platbu dokončíte přes GoPay.
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

        {/* Úspěšná / Chybová hláška */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Typ nákupu">
          <button type="button" role="tab" aria-selected={activeProduct === 'credits'} onClick={() => setActiveProduct('credits')} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeProduct === 'credits' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>Kreditní balíčky</button>
          <button type="button" role="tab" aria-selected={activeProduct === 'clothing'} onClick={() => setActiveProduct('clothing')} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeProduct === 'clothing' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>EMS oblečení</button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-8">
        {/* 1. Výběr balíčku */}
        {activeProduct === 'credits' && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" /> Kreditní balíčky
            </h2>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 sm:inline-flex">1 kredit = 1 lekce</span>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${currentPackages.length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-2 2xl:grid-cols-3'}`}>
            {currentPackages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedPackageId(pkg.id); }}
                  className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
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
        </section>}



        {activeProduct === 'clothing' && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Shirt size={25} /></div>
              <div>
                <span className="mb-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">EMS kolekce</span>
                <h2 className="text-xl font-bold text-slate-900">Tréninkové oblečení</h2>
                <p className="mt-1 text-sm text-slate-600">Objednejte si oblečení za 990 Kč. Vyzvednutí proběhne na další lekci EMS.</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">Skladem ve velikosti {selectedClothingSize}: {clothingInventory.find((item) => item.size === selectedClothingSize)?.stock ?? 0} ks</p>
              </div>
            </div>
            <div className="w-full sm:max-w-[340px]">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Vyberte velikost</p>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Velikost EMS oblečení">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const available = clothingInventory.find((item) => item.size === size)?.stock ?? 0;
                  const selected = selectedClothingSize === size;
                  return <button key={size} type="button" disabled={available < 1} aria-pressed={selected} onClick={() => setSelectedClothingSize(size)} className={`relative rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${selected ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-600' : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50'} disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:hover:border-slate-100 disabled:hover:bg-slate-50`}>
                    <span className="block text-sm font-extrabold">{size}</span>
                    <span className={`mt-0.5 block text-[10px] font-semibold ${available > 0 ? selected ? 'text-emerald-700' : 'text-slate-400' : 'text-slate-300'}`}>{available > 0 ? `${available} ks skladem` : 'Vyprodáno'}</span>
                    {selected && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-emerald-600" />}
                  </button>;
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">Vybraná velikost: <strong className="text-slate-700">{selectedClothingSize}</strong></p>
              <button type="button" onClick={handleOrderClothing} disabled={orderingClothing || (clothingInventory.find((item) => item.size === selectedClothingSize)?.stock ?? 0) < 1} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {orderingClothing ? 'Připravuji platbu…' : (clothingInventory.find((item) => item.size === selectedClothingSize)?.stock ?? 0) < 1 ? 'Velikost vyprodána' : <>Do košíku · 990 Kč <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
          {clothingOrders.length > 0 && <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="mb-2 text-sm font-bold text-slate-800">Vaše objednávky oblečení</h3>
            <div className="divide-y divide-slate-100">{clothingOrders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="text-slate-600">{new Date(order.created_at).toLocaleDateString('cs-CZ')} · velikost {order.size} · 990 Kč</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{{ NEW: 'Nová', IN_PROCESS: 'Zpracovává se', READY: 'Připravená k vyzvednutí', COMPLETED: 'Dokončená', CANCELLED: 'Zrušená' }[order.status] || order.status}</span>
            </div>)}</div>
          </div>}
        </section>}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Souhrn objednávky</h2>
            <p className="mt-1 text-xs text-slate-500">Vybraný produkt</p>
            <div className="my-5 space-y-4 border-y border-slate-100 py-4">
              {activeProduct === 'credits' ? <div className="flex items-start justify-between gap-3 text-sm"><div><p className="font-bold text-slate-800">{selectedPackage?.title}</p><p className="mt-0.5 text-xs text-slate-500">{selectedPackage?.credits} {selectedPackage?.credits === 1 ? 'kredit' : 'kreditů'}</p></div><span className="font-bold text-slate-800">{selectedPackage?.priceCZK.toLocaleString('cs-CZ')} Kč</span></div> : <div className="flex items-start justify-between gap-3 text-sm"><div><p className="font-bold text-slate-800">EMS oblečení</p><p className="mt-0.5 text-xs text-slate-500">Velikost {selectedClothingSize} · 1 ks</p></div><span className="font-bold text-slate-800">990 Kč</span></div>}
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs text-slate-500"><span>Platba zabezpečena GoPay</span><ShieldIcon size={15} className="text-emerald-600" /></div>
            <div className="flex items-end justify-between py-4"><span className="text-sm font-bold text-slate-700">Celkem</span><span className="text-2xl font-black text-slate-900">{activeProduct === 'credits' ? selectedPackage?.priceCZK.toLocaleString('cs-CZ') : '990'} Kč</span></div>
            {activeProduct === 'credits' ? <button onClick={handleGoPayPayment} disabled={processingPayment || !selectedPackage} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50">{processingPayment ? 'Přesměrovávám na GoPay…' : <><Lock size={17} />Zaplatit přes GoPay</>}</button> : <button onClick={handleOrderClothing} disabled={orderingClothing || (clothingInventory.find((item) => item.size === selectedClothingSize)?.stock ?? 0) < 1} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50">{orderingClothing ? 'Připravuji platbu…' : <><Lock size={17} />Zaplatit přes GoPay</>}</button>}
            {activeProduct === 'clothing' && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">EMS oblečení si vyzvednete na další lekci. Po zaplacení vám přijde potvrzení e-mailem.</p>}
          </section>
        </aside>
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
                    <p className="font-medium text-slate-900">{tx.description || ({
                      CHARGE: 'Dobití kreditů',
                      RESERVATION: 'Rezervace tréninku',
                      RESERVATION_REFUND: 'Vrácení kreditu za zrušenou rezervaci',
                    } as Record<string, string>)[tx.type || ''] || 'Pohyb kreditů'}</p>
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
          {hasMoreTransactions && (
            <button
              type="button"
              onClick={loadOlderTransactions}
              disabled={loadingMoreTransactions}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingMoreTransactions ? 'Načítám…' : 'Načíst starší pohyby'}
            </button>
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

// Hlavní export s hranicí Suspense pro úspěšný prerender/build
export default function KredityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium text-sm">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
          Načítám...
        </div>
      }
    >
      <KredityContent />
    </Suspense>
  );
}
