import { getSupabaseAdmin } from '@/lib/clothing-store';
import { Resend } from 'resend';
import { escapeEmailHtml } from '@/lib/clothing-store';

export interface GoPayClothingPaymentDetails {
  id?: string | number;
  state?: string;
  additional_params?: { name: string; value: string }[];
  custom_params?: { name: string; value: string }[];
}

function paymentParams(payment: GoPayClothingPaymentDetails) {
  return payment.additional_params || payment.custom_params || [];
}

export async function isClothingPayment(payment: GoPayClothingPaymentDetails) {
  return paymentParams(payment).some((param) => param.name === 'order_type' && param.value === 'ems_clothing');
}

export async function processClothingPayment(payment: GoPayClothingPaymentDetails) {
  if (!payment.id) throw new Error('GoPay platba oblečení neobsahuje ID.');
  const db = getSupabaseAdmin();
  const { data: order, error } = await db.from('ems_clothing_orders')
    .select('id, status, customer_name, customer_email, quantity, unit_price, size')
    .eq('gopay_payment_id', String(payment.id)).maybeSingle();
  if (error) throw error;
  if (!order) throw new Error('Objednávka oblečení pro tuto GoPay platbu nebyla nalezena.');
  if (order.status !== 'PENDING_PAYMENT') return order;

  const { data: updated, error: updateError } = await db.from('ems_clothing_orders')
    .update({ status: 'NEW', updated_at: new Date().toISOString() })
    .eq('id', order.id).eq('status', 'PENDING_PAYMENT').select('*').maybeSingle();
  if (updateError) throw updateError;

  // Stock was reserved when checkout started; successful payment keeps that reservation.

  if (updated && process.env.RESEND_API_KEY) {
    const adminEmails = Array.from(new Set((process.env.EMS_STORE_ADMIN_EMAILS || '').split(',').map((email) => email.trim())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))));
    const safeName = escapeEmailHtml(order.customer_name);
    const safeId = escapeEmailHtml(order.id);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const messages = [resend.emails.send({
      from: 'EMS Znojmo <registrace@emsznojmo.cz>',
      to: [order.customer_email],
      subject: 'Platba přijata – objednávka EMS oblečení',
      html: `<p>Dobrý den, ${safeName},</p><p>děkujeme, vaše platba za EMS oblečení ve velikosti ${order.size} byla přijata.</p><p>Objednávku si vyzvednete na své další lekci EMS.</p><p>Číslo objednávky: <strong>${safeId}</strong></p><p>Tým EMS Znojmo</p>`,
    })];
    if (adminEmails.length) messages.push(resend.emails.send({
      from: 'EMS Znojmo <registrace@emsznojmo.cz>',
      to: adminEmails,
      subject: 'Uhrazená objednávka EMS oblečení',
      html: `<p>GoPay potvrdilo platbu za objednávku EMS oblečení.</p><p>Klient: <strong>${safeName}</strong><br>E-mail: ${escapeEmailHtml(order.customer_email)}<br>Velikost: ${order.size}<br>Počet kusů: ${order.quantity}<br>Částka: ${(order.unit_price * order.quantity).toLocaleString('cs-CZ')} Kč<br>Objednávka: ${safeId}</p>`,
    }));
    const results = await Promise.all(messages);
    for (const result of results) if (result.error) console.error('E-mail po zaplacení oblečení se nepodařilo odeslat:', result.error);
  }
  return updated || order;
}
