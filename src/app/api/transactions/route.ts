import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const transactions = await db.transaction.findMany({
      orderBy: { date: 'desc' },
      include: {
        buyer: true,
        items: { include: { product: true } },
      },
    })
    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { buyerId, type, items, notes } = body

    let totalAmount = 0
    const itemData = []

    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        return NextResponse.json({ error: `Produk ${item.productId} tidak ditemukan` }, { status: 400 })
      }

      const subtotal = product.sellPrice * item.quantity
      totalAmount += subtotal

      itemData.push({
        productId: item.productId,
        quantity: item.quantity,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        subtotal,
      })

      // Update stock
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    const paidAmount = type === 'CASH' ? totalAmount : (Number(body.paidAmount) || 0)
    let status = 'PAID'
    if (type === 'CREDIT') {
      if (paidAmount <= 0) status = 'UNPAID'
      else if (paidAmount < totalAmount) status = 'PARTIAL'
      else status = 'PAID'
    }

    const transaction = await db.transaction.create({
      data: {
        buyerId,
        type,
        totalAmount,
        paidAmount,
        status,
        notes: notes || '',
        items: { create: itemData },
      },
      include: {
        buyer: true,
        items: { include: { product: true } },
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
