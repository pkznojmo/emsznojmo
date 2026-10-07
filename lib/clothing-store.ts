import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Chybí konfigurace Supabase na serveru.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getAuthenticatedUser(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  return error ? null : data.user;
}

export async function getUserRole(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('profiles').select('role').eq('id', userId).single();
  if (error) throw error;
  return String(data.role || '').toUpperCase();
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char] || char);
}
