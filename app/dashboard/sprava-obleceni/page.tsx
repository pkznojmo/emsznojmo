'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Package, Plus, RefreshCw, Shirt, ShoppingBag, X } from 'lucide-react';
import Sidebar from '../../comp/Sidebar';
import { supabase } from '../../../lib/supabase';

interface ClothingOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  quantity: number;
  unit_price: number;
  size: string;
  status: string;
  created_at: string;
}

interface StoreData {
  orders: ClothingOrder[];
  inventory: { size: string; stock: number }[];
  counts: { total: number; inProgress: number; completed: number; new: number };
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nová', IN_PROCESS: 'Zpracovává se', READY: 'Připravená k vyzvednutí', COMPLETED: 'Dokončená', CANCELLED: 'Zrušená',
};
const NEXT_STATUS: Record<string, { value: string; label: string }> = {
  NEW: { value: 'IN_PROCESS', label: 'Začít zpracovávat' },
  IN_PROCESS: { value: 'READY', label: 'Připravená k vyzvednutí' },
  READY: { value: 'COMPLETED', label: 'Označit jako vydanou' },
};

export default function ClothingStoreAdminPage() {
  const router = useRouter();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restockSize, setRestockSize] = useState('M');
  const [restockAmount, setRestockAmount] = useState('1');
  const [addingStock, setAddingStock] = useState(false);
  const [message, setMessage] = useState('');

  const getToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token || null;
  }, []);

  const loadData = useCallback(async () => {
    const token = await getToken();
    if (!token) { router.push('/prihlaseni'); return; }
    const response = await fetch('/api/admin/clothing-orders', { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401) { router.push('/prihlaseni'); return; }
    if (response.status === 403) { router.push('/dashboard'); return; }
    const result = await response.json() as StoreData & { message?: string };
    if (!response.ok) throw new Error(result.message || 'Data obchodu se nepodařilo načíst.');
    setData(result);
  }, [getToken, router]);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      void loadData().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Nastala chyba.')).finally(() => { if (alive) setLoading(false); });
    }, 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [loadData]);

  const update = async (body: Record<string, string | number>) => {
    const token = await getToken();
    if (!token) throw new Error('Přihlášení vypršelo.');
    const response = await fetch('/api/admin/clothing-orders', {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) throw new Error(result.message || 'Změnu se nepodařilo uložit.');
    await loadData();
  };

  const addStock = async () => {
    setAddingStock(true); setMessage('');
    try { await update({ action: 'inventory_add', size: restockSize, amount: Number(restockAmount) }); setMessage(`Do skladu byla přidána velikost ${restockSize}.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Změnu se nepodařilo uložit.'); }
    finally { setAddingStock(false); }
  };

  const changeStatus = async (orderId: string, status: string) => {
    setAddingStock(true); setMessage('');
    try { await update({ orderId, status }); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Stav objednávky se nepodařilo změnit.'); }
    finally { setAddingStock(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Načítám správu obchodu…</div>;

  return <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row text-gray-900">
    <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push('/prihlaseni'); }} />
    <main className="w-full max-w-7xl space-y-7 p-4 pb-24 sm:p-6 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Administrace</p><h1 className="mt-1 text-3xl font-black">Správa EMS oblečení</h1><p className="mt-2 text-sm text-gray-500">Přehled objednávek, skladových zásob a výdeje oblečení.</p></div>
        <button onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"><RefreshCw size={16} />Obnovit</button>
      </header>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-900">{message}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Objednávek celkem', value: data?.counts.total ?? 0, icon: ShoppingBag, tint: 'text-indigo-600 bg-indigo-50' },
          { label: 'Nové ke schválení', value: data?.counts.new ?? 0, icon: Package, tint: 'text-orange-600 bg-orange-50' },
          { label: 'V procesu', value: data?.counts.inProgress ?? 0, icon: RefreshCw, tint: 'text-blue-600 bg-blue-50' },
          { label: 'Dokončené', value: data?.counts.completed ?? 0, icon: Check, tint: 'text-emerald-600 bg-emerald-50' },
        ].map((card) => { const Icon = card.icon; return <article key={card.label} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className={`rounded-xl p-3 ${card.tint}`}><Icon size={22} /></div><div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">{card.label}</p><p className="text-2xl font-black">{card.value}</p></div></article>; })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-6"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Shirt size={22} /></div><div><h2 className="font-extrabold">Sklad EMS oblečení</h2><p className="mt-1 text-sm text-gray-500">Zásoby jsou vedené samostatně pro každou velikost.</p></div></div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">{['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => <div key={size} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${restockSize === size ? 'border-emerald-200 bg-emerald-50/70' : 'border-gray-100 bg-gray-50'}`}><span className="font-bold text-gray-800">{size}</span><span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-gray-600 shadow-sm">{data?.inventory.find((item) => item.size === size)?.stock ?? 0} ks</span></div>)}</div>
        <div className="border-t border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><div className="rounded-lg bg-white p-2 text-emerald-700 shadow-sm"><Plus size={17} /></div><div><h3 className="text-sm font-extrabold text-gray-900">Doplnit sklad</h3><p className="text-xs text-gray-500">Vyberte velikost a počet nově naskladněných kusů.</p></div></div>
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
            <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Velikost</legend><div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">{['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => <button key={size} type="button" aria-pressed={restockSize === size} onClick={() => setRestockSize(size)} className={`rounded-lg border px-3 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${restockSize === size ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'}`}>{size}</button>)}</div></fieldset>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Počet kusů<input type="number" min="1" step="1" value={restockAmount} onChange={(event) => setRestockAmount(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-bold text-gray-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /><span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-gray-400">Přidá se k současné zásobě</span></label>
            <button onClick={() => void addStock()} disabled={addingStock} aria-label={`Přidat do skladu ${restockSize}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg disabled:cursor-wait disabled:opacity-60"><Plus size={18} />{addingStock ? 'Přidávám…' : `Naskladnit ${restockSize}`}</button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-extrabold">Objednávky</h2></div>
        {!data?.orders.length ? <p className="p-8 text-center text-sm text-gray-500">Zatím nebyla vytvořena žádná objednávka.</p> : <div className="divide-y divide-gray-100">
          {data.orders.map((order) => <article key={order.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{order.customer_name}</h3><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">{STATUS_LABELS[order.status] || order.status}</span></div><p className="mt-1 text-sm text-gray-500">{order.customer_email} · velikost {order.size} · {order.quantity} ks · {(order.unit_price * order.quantity).toLocaleString('cs-CZ')} Kč</p><p className="mt-1 text-xs text-gray-400">{new Date(order.created_at).toLocaleString('cs-CZ')} · číslo {order.id.slice(0, 8)}</p></div>
            <div className="flex flex-wrap gap-2">
              {NEXT_STATUS[order.status] && <button disabled={addingStock} onClick={() => void changeStatus(order.id, NEXT_STATUS[order.status].value)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14} />{NEXT_STATUS[order.status].label}</button>}
              {!['COMPLETED', 'CANCELLED'].includes(order.status) && <button disabled={addingStock} onClick={() => void changeStatus(order.id, 'CANCELLED')} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X size={14} />Zrušit</button>}
            </div>
          </article>)}
        </div>}
      </section>
      <p className="text-xs text-gray-400">Přechod objednávky: Nová → Zpracovává se → Připravená k vyzvednutí → Dokončená.</p>
    </main>
  </div>;
}
