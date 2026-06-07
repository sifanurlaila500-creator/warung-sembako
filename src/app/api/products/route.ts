import { NextRequest, NextResponse } from 'next/server'
import { getProducts, createProduct } from '@/lib/db-prisma'

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ error: 'Nama produk harus diisi' }, { status: 400 })
    }
    const product = await createProduct({
      name: body.name,
      unit: body.unit || 'pcs',
      buyPrice: Number(body.buyPrice) || 0,
      sellPrice: Number(body.sellPrice) || 0,
      stock: Number(body.stock) || 0,
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
