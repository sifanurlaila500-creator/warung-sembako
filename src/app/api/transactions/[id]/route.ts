import { getData, setData } from '@/lib/db-store'
import { NextRequest, NextResponse } from 'next/server'

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
    const transactions: Transaction[] = await getData('transactions.json')
    const tx = transactions.find((t) => t.id === id)

    if (!tx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // Restore stock for items that were sold
    if (tx.items && tx.items.length > 0) {
      const products: Product[] = await getData('products.json')
      for (const item of tx.items) {
        const pIdx = products.findIndex((p) => p.id === item.productId)
        if (pIdx !== -1) {
          products[pIdx].stock += item.quantity
        }
      }
      await setData('products.json', products)
    }

    // Remove the transaction
    const filtered = transactions.filter((t) => t.id !== id)
    await setData('transactions.json', filtered)

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
