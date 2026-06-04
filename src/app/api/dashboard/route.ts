import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Total penjualan
    const transactions = await db.transaction.findMany({
      include: { items: true },
    })

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

    // Jumlah pembeli dengan hutang
    const buyersWithDebt = await db.buyer.findMany({
      include: {
        transactions: {
          where: { status: { in: ['UNPAID', 'PARTIAL'] } },
        },
      },
    })

    const activeDebtors = buyersWithDebt.filter(
      (b) => b.transactions.length > 0
    ).length

    // Total produk
    const totalProducts = await db.product.count()
    const totalBuyers = await db.buyer.count()

    // Hutang per pembeli
    const debtByBuyer = buyersWithDebt
      .filter((b) => b.transactions.length > 0)
      .map((b) => {
        const debt = b.transactions.reduce(
          (sum, t) => sum + (t.totalAmount - t.paidAmount),
          0
        )
        return {
          id: b.id,
          name: b.name,
          phone: b.phone,
          totalDebt: debt,
        }
      })
      .sort((a, b) => b.totalDebt - a.totalDebt)

    // Transaksi terbaru
    const recentTransactions = await db.transaction.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        buyer: true,
        items: { include: { product: true } },
      },
    })

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
