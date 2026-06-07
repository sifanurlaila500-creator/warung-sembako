import { exportAllData, importAllData } from '@/lib/db-store'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/backup - Export all data
export async function GET() {
  try {
    const data = await exportAllData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/backup - Import all data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await importAllData(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
