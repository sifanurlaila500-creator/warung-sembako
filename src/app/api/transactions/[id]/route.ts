import { NextRequest, NextResponse } from 'next/server'
import { deleteTransaction } from '@/lib/db-store'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteTransaction(id)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
