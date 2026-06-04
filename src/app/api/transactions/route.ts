import { readData, writeData, generateId } from '@/lib/json-db'
import { NextRequest, NextResponse } from 'next/server'

interface Product {
  id: string
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: number
}

interface TransactionItem {
  productId: string
  productName: string
  quantity: number
  buyPrice: number
  sellPrice: number
  subtotal: number
}

interface Transaction {
  id: string
  buyerId: string
  date: string
  totalAmount: number
  paidAmount: number
  type: string
  status: string
  notes: string
  items: TransactionItem[]
  createdAt: string
}

interface Buyer {
  id: string
  name: string
}

export async function GET() {
  try {
    const transactions: Transaction[] = readData('transactions.json')
    const buyers: Buyer[] = readData('buyers.json')

    // Enrich transactions with buyer name
    const enriched = transactions.map((tx) => ({
      ...tx,
      buyer: buyers.find((b) => b.id === tx.buyerId) || { name: 'Unknown' },
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { buyerId, type, items, notes, date, totalOverride } = body

    const transactions: Transaction[] = readData('transactions.json')
    const products: Product[] = readData('products.json')
    const buyers: Buyer[] = readData('buyers.json')

    let totalAmount = 0
    const itemData: TransactionItem[] = []

    // If totalOverride is provided (quick debt entry), use it directly
    if (totalOverride && Number(totalOverride) > 0 && (!items || items.length === 0)) {
      totalAmount = Number(totalOverride)
    } else {
      // Normal transaction with items
      for (const item of (items || [])) {
        const product = products.find((p) => p.id === item.productId)
        if (!product) {
          return NextResponse.json({ error: `Produk tidak ditemukan` }, { status: 400 })
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

        // Update stock
        const pIdx = products.findIndex((p) => p.id === item.productId)
        if (pIdx !== -1) {
          products[pIdx].stock = Math.max(0, products[pIdx].stock - item.quantity)
        }
      }
      if (itemData.length > 0) {
        writeData('products.json', products)
      }
    }

    const paidAmount = type === 'CASH' ? totalAmount : (Number(body.paidAmount) || 0)
    let status = 'PAID'
    if (type === 'CREDIT') {
      if (paidAmount <= 0) status = 'UNPAID'
      else if (paidAmount < totalAmount) status = 'PARTIAL'
      else status = 'PAID'
    }

    const newTx: Transaction = {
      id: generateId(),
      buyerId,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      totalAmount,
      paidAmount,
      type,
      status,
      notes: notes || '',
      items: itemData,
      createdAt: new Date().toISOString(),
    }

    transactions.push(newTx)
    writeData('transactions.json', transactions)

    const buyer = buyers.find((b) => b.id === buyerId) || { name: 'Unknown' }

    return NextResponse.json({ ...newTx, buyer }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
