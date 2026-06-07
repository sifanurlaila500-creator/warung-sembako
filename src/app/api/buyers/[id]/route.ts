import { NextRequest, NextResponse } from 'next/server'
import { updateBuyer, deleteBuyer } from '@/lib/db-prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ error: 'Nama harus diisi' }, { status: 400 })
    }
    const buyer = await updateBuyer(id, { name: body.name, phone: body.phone, address: body.address })
    return NextResponse.json(buyer)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteBuyer(id)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
