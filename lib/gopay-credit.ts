import { createClient } from '@supabase/supabase-js';

type GoPayParam = { name?: string; value?: string | number };

export interface GoPayPaymentDetails {
  id?: string | number;
  state?: string;
  additional_params?: GoPayParam[];
  custom_params?: GoPayParam[];
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processCreditPayment(paymentDetails: GoPayPaymentDetails) {
  if (paymentDetails.state !== 'PAID') return;

  if (!paymentDetails.id) throw new Error('GoPay platba nemá ID.');
  const paymentId = String(paymentDetails.id);
  if (!/^\d+$/.test(paymentId)) throw new Error(`GoPay platba má neplatné ID: ${paymentId}.`);

  const params = paymentDetails.additional_params || paymentDetails.custom_params;
  if (!Array.isArray(params)) throw new Error(`GoPay platba ${paymentId} nemá parametry kreditu.`);

  const userId = params.find((param) => param.name === 'user_id')?.value;
  const creditsValue = params.find((param) => param.name === 'credits')?.value;
  const creditsToAdd = Number(creditsValue);

  if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error(`GoPay platba ${paymentId} nemá platné ID uživatele.`);
  }
  if (!Number.isSafeInteger(creditsToAdd) || creditsToAdd <= 0) {
    throw new Error(`GoPay platba ${paymentId} obsahuje neplatný počet kreditů.`);
  }

  const { error } = await supabaseAdmin.rpc('apply_gopay_credit_payment', {
    p_payment_id: paymentId,
    p_user_id: userId,
    p_credits: creditsToAdd,
  });

  if (error) {
    console.error('Chyba při atomickém zpracování GoPay platby:', error);
    throw error;
  }
}
