import { NextRequest, NextResponse } from 'next/server'
import { getTransactions, createTransaction } from '@/lib/db-prisma'

export async function GET() {
  try {
    const transactions = await getTransactions()
    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { buyerId, type, items, notes, date, totalOverride } = body

    let totalAmount = 0
    const itemData: { productId: string; productName: string; quantity: number; buyPrice: number; sellPrice: number; subtotal: number }[] = []

    // If totalOverride is provided (quick debt entry), use it directly
    if (totalOverride && Number(totalOverride) > 0 && (!items || items.length === 0)) {
      totalAmount = Number(totalOverride)
    } else {
      // Normal transaction with items
      const { getProducts } = await import('@/lib/db-store')
      const products = await getProducts()

      for (const item of (items || [])) {
        const product = products.find((p: any) => p.id === item.productId)
        if (!product) {
          return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 400 })
        }

        const subtotal = product.sellPrice * item.quantity
        totalAmount += subtotal

        itemData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          subtotal,
        })
      }
    }

    const paidAmount = type === 'CASH' ? totalAmount : (Number(body.paidAmount) || 0)

    const transaction = await createTransaction({
      buyerId,
      type,
      paidAmount,
      notes: notes || '',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      items: itemData,
      totalAmount,
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
