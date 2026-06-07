import { NextResponse } from 'next/server'
import { getReportsData } from '@/lib/db-store'

export async function GET() {
  try {
    const data = await getReportsData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
