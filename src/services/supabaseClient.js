import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'AQUI_PEGAS_TU_PROJECT_URL'
const supabaseAnonKey = 'AQUI_PEGAS_TU_ANON_PUBLIC_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)