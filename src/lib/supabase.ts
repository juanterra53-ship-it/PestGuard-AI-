import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase: Faltando variáveis de ambiente!', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    hint: 'Verifique se você adicionou VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nos Secrets.'
  });
}

// Inicializa o cliente Supabase de forma segura
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
