// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ESTA ES LA CLAVE:
    // 'localStorage' (default) = Persiste por siempre
    // 'sessionStorage' = Se borra al cerrar la pestaña
    storage: sessionStorage, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})