import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.buyer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const buyer = await db.buyer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone || '',
        address: body.address || '',
      },
    })
    return NextResponse.json(buyer)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
