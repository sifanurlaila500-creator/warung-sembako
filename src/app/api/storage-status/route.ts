import { getStorageMode } from '@/lib/db-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const status = getStorageMode()
  return NextResponse.json(status)
}
