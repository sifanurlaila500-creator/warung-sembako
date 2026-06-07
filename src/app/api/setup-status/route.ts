import { isSupabaseReady } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    configured: isSupabaseReady,
    message: isSupabaseReady
      ? 'Supabase terhubung'
      : 'Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env',
  })
}
