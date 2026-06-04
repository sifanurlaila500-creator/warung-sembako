import { getData } from '@/lib/db-store'
import { NextResponse } from 'next/server'

interface Buyer {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
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
  items: { productId: string; productName: string; quantity: number; buyPrice: number; sellPrice: number; subtotal: number }[]
}

interface Payment {
  id: string
  buyerId: string
  amount: number
  date: string
  notes: string
}

interface Product {
  id: string
  name: string
}

export async function GET() {
  try {
    const buyers: Buyer[] = await getData('buyers.json')
    const transactions: Transaction[] = await getData('transactions.json')
    const payments: Payment[] = await getData('payments.json')
    const products: Product[] = await getData('products.json')

    // Total penjualan
    const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0)
    const totalDebt = totalSales - totalPaid

    // Total modal (harga beli)
    const totalCapital = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.buyPrice * i.quantity, 0),
      0
    )

    // Total profit
    const totalProfit = totalSales - totalCapital

    // Sisa modal = yang sudah dibayar - modal
    const remainingCapital = totalPaid - totalCapital

    // Hutang per pembeli
    const debtByBuyer = buyers
      .map((b) => {
        const buyerTx = transactions.filter((t) => t.buyerId === b.id && t.type === 'CREDIT' && t.status !== 'PAID')
        const debt = buyerTx.reduce((sum, t) => sum + (t.totalAmount - t.paidAmount), 0)
        return { id: b.id, name: b.name, phone: b.phone, totalDebt: debt }
      })
      .filter((b) => b.totalDebt > 0)
      .sort((a, b) => b.totalDebt - a.totalDebt)

    const activeDebtors = debtByBuyer.length
    const totalProducts = products.length
    const totalBuyers = buyers.length

    // Transaksi terbaru
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((tx) => ({
        ...tx,
        buyer: buyers.find((b) => b.id === tx.buyerId) || { name: 'Unknown' },
      }))

    return NextResponse.json({
      totalSales,
      totalPaid,
      totalDebt,
      totalCapital,
      totalProfit,
      remainingCapital,
      activeDebtors,
      totalProducts,
      totalBuyers,
      debtByBuyer,
      recentTransactions,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
