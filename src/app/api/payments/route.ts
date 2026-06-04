import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const payments = await db.payment.findMany({
      orderBy: { date: 'desc' },
      include: {
        buyer: true,
        transaction: true,
      },
    })
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { buyerId, amount, notes } = body
    const payAmount = Number(amount)

    if (!buyerId || payAmount <= 0) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    // Auto-distribute payment across buyer's unpaid transactions (oldest first)
    const unpaidTransactions = await db.transaction.findMany({
      where: {
        buyerId,
        status: { in: ['UNPAID', 'PARTIAL'] },
      },
      orderBy: { date: 'asc' },
    })

    let remaining = payAmount
    const updatedTxIds: string[] = []

    for (const tx of unpaidTransactions) {
      if (remaining <= 0) break
      const owing = tx.totalAmount - tx.paidAmount
      const payForThis = Math.min(remaining, owing)
      const newPaid = tx.paidAmount + payForThis
      let newStatus = 'PAID'
      if (newPaid <= 0) newStatus = 'UNPAID'
      else if (newPaid < tx.totalAmount) newStatus = 'PARTIAL'

      await db.transaction.update({
        where: { id: tx.id },
        data: { paidAmount: newPaid, status: newStatus },
      })
      updatedTxIds.push(tx.id)
      remaining -= payForThis
    }

    // Create payment record linked to the first updated transaction (or none if no transactions)
    const payment = await db.payment.create({
      data: {
        buyerId,
        transactionId: updatedTxIds.length > 0 ? updatedTxIds[0] : null,
        amount: payAmount,
        notes: notes || '',
      },
      include: {
        buyer: true,
        transaction: true,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
