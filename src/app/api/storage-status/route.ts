import { getStorageMode } from '@/lib/db-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const status = getStorageMode()
  return NextResponse.json({
    ...status,
    isVercel: !!process.env.VERCEL,
    kvConfigured: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
  })
}
