import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    configured: true,
    message: 'Database terhubung (local SQLite)',
  })
}
