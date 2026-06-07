import { NextRequest, NextResponse } from 'next/server'
import { getPayments, createPayment } from '@/lib/db-store'

export async function GET() {
  try {
    const payments = await getPayments()
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { buyerId, amount, notes, date } = body
    const payAmount = Number(amount)

    if (!buyerId || payAmount <= 0) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const payment = await createPayment({
      buyerId,
      amount: payAmount,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      notes: notes || '',
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
