import { NextRequest, NextResponse } from 'next/server'
import { updateProduct, deleteProduct } from '@/lib/db-store'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const product = await updateProduct(id, {
      name: body.name,
      unit: body.unit || 'pcs',
      buyPrice: Number(body.buyPrice) || 0,
      sellPrice: Number(body.sellPrice) || 0,
      stock: Number(body.stock) || 0,
    })
    return NextResponse.json(product)
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
    const result = await deleteProduct(id)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
