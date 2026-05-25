import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Klient se vytvoří pouze jednou při importu souboru
export const supabase = createClient(supabaseUrl, supabaseAnonKey);