import { getData, setData, generateId } from '@/lib/db-store'
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

export async function GET() {
  try {
    const products: Product[] = await getData('products.json')
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const products: Product[] = await getData('products.json')

    const newProduct: Product = {
      id: generateId(),
      name: body.name,
      unit: body.unit || 'pcs',
      buyPrice: Number(body.buyPrice) || 0,
      sellPrice: Number(body.sellPrice) || 0,
      stock: Number(body.stock) || 0,
      createdAt: new Date().toISOString(),
    }

    products.push(newProduct)
    await setData('products.json', products)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
