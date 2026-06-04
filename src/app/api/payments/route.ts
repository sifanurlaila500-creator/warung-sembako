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
    const { buyerId, transactionId, amount, notes } = body

    const payment = await db.payment.create({
      data: {
        buyerId,
        transactionId: transactionId || null,
        amount: Number(amount),
        notes: notes || '',
      },
      include: {
        buyer: true,
        transaction: true,
      },
    })

    // Update transaction paid amount and status
    if (transactionId) {
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId },
      })
      if (transaction) {
        const newPaidAmount = transaction.paidAmount + Number(amount)
        let newStatus = 'PAID'
        if (newPaidAmount <= 0) newStatus = 'UNPAID'
        else if (newPaidAmount < transaction.totalAmount) newStatus = 'PARTIAL'
        else newStatus = 'PAID'

        await db.transaction.update({
          where: { id: transactionId },
          data: { paidAmount: newPaidAmount, status: newStatus },
        })
      }
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
