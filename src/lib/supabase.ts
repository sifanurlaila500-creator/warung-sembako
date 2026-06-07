import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isConfigured = !!(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-') &&
  !supabaseKey.includes('your-') &&
  supabaseUrl.startsWith('http')
)

if (!isConfigured) {
  console.warn('⚠️ Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
}

export const supabase = isConfigured ? createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
}) : null

export const isSupabaseReady = isConfigured
