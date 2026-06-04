import { readData, writeData } from '@/lib/json-db'
import { NextRequest, NextResponse } from 'next/server'

interface Product {
  id: string
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: number
  createdAt: string
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const products: Product[] = readData('products.json')
    const filtered = products.filter((p) => p.id !== id)
    if (filtered.length === products.length) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }
    writeData('products.json', filtered)
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
    const products: Product[] = readData('products.json')
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }
    products[idx] = {
      ...products[idx],
      name: body.name,
      unit: body.unit || 'pcs',
      buyPrice: Number(body.buyPrice) || 0,
      sellPrice: Number(body.sellPrice) || 0,
      stock: Number(body.stock) || 0,
    }
    writeData('products.json', products)
    return NextResponse.json(products[idx])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
