// Ukázka logiky párování v API route
import { supabase } from '@/lib/supabase';

export async function GET() {
  // 1. Zavolá API Fio banky pro nové transakce
  const response = await fetch(`https://fioapi.fio.cz/v1/rest/periods/${LAST_CHECK_DATE}/transactions.json`);
  const data = await response.json();
  const transactions = data.accountStatement.transactionList.transaction;

  for (const tx of transactions) {
    const amount = tx.column1.value;          // Částka
    const vs = tx.column5?.value;             // Variabilní symbol (rodné číslo)
    const bankTxId = tx.column22.value;       // Unikátní ID transakce v bance

    if (!vs || amount <= 0) continue;

    // 2. Kontrola, zda transakce již nebyla zpracována
    const { data: existingOrder } = await supabase
      .from('payment_orders')
      .select('id')
      .eq('bank_transaction_id', bankTxId)
      .single();

    if (existingOrder) continue; // Již zpracováno

    // 3. Vyhledání čekající objednávky
    const { data: order } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('variable_symbol', vs)
      .eq('amount_czk', amount)
      .eq('status', 'pending')
      .single();

    if (order) {
      // 4. Označit objednávku jako zaplacenou
      await supabase
        .from('payment_orders')
        .update({ status: 'paid', paid_at: new Date(), bank_transaction_id: bankTxId })
        .eq('id', order.id);

      // 5. Přičíst kredity uživateli
      await supabase.rpc('add_credits', { 
        target_user_id: order.user_id, 
        credits_count: order.credits_to_add 
      });

      // 6. Zaznamenat do historie kreditů
      await supabase.from('credit_transactions').insert({
        user_id: order.user_id,
        amount: order.credits_to_add,
        type: 'bank_purchase',
        description: `Nákup ${order.credits_to_add} kreditů bankovním převodem`,
        payment_order_id: order.id
      });
    }
  }
}