import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured (not placeholder values)
const isConfigured = !!(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-') &&
  !supabaseKey.includes('your-') &&
  supabaseUrl.startsWith('http')
)

export const supabase = isConfigured ? createClient(supabaseUrl!, supabaseKey!) : null
export const isSupabaseReady = isConfigured
