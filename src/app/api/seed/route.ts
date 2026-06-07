import { seedDatabase } from '@/lib/db-prisma'
import { NextResponse } from 'next/server'

// POST /api/seed - Seed initial buyer data
export async function POST() {
  try {
    const result = await seedDatabase()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
