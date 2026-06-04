import { getData, setData, generateId } from '@/lib/db-store'
import { NextRequest, NextResponse } from 'next/server'

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
  transactionId: string | null
  amount: number
  date: string
  notes: string
  createdAt: string
}

interface Buyer {
  id: string
  name: string
}

export async function GET() {
  try {
    const payments: Payment[] = await getData('payments.json')
    const buyers: Buyer[] = await getData('buyers.json')

    const enriched = payments.map((p) => ({
      ...p,
      buyer: buyers.find((b) => b.id === p.buyerId) || { name: 'Unknown' },
    }))

    return NextResponse.json(enriched)
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

    const transactions: Transaction[] = await getData('transactions.json')
    const payments: Payment[] = await getData('payments.json')
    const buyers: Buyer[] = await getData('buyers.json')

    // Auto-distribute payment across buyer's unpaid transactions (oldest first)
    const unpaidTx = transactions
      .filter((t) => t.buyerId === buyerId && (t.status === 'UNPAID' || t.status === 'PARTIAL'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let remaining = payAmount
    let firstTxId: string | null = null

    for (const tx of unpaidTx) {
      if (remaining <= 0) break
      const owing = tx.totalAmount - tx.paidAmount
      const payForThis = Math.min(remaining, owing)
      const newPaid = tx.paidAmount + payForThis
      let newStatus = 'PAID'
      if (newPaid <= 0) newStatus = 'UNPAID'
      else if (newPaid < tx.totalAmount) newStatus = 'PARTIAL'

      const idx = transactions.findIndex((t) => t.id === tx.id)
      if (idx !== -1) {
        transactions[idx].paidAmount = newPaid
        transactions[idx].status = newStatus
      }

      if (!firstTxId) firstTxId = tx.id
      remaining -= payForThis
    }

    await setData('transactions.json', transactions)

    // Create payment record
    const newPayment: Payment = {
      id: generateId(),
      buyerId,
      transactionId: firstTxId,
      amount: payAmount,
      notes: notes || '',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    payments.push(newPayment)
    await setData('payments.json', payments)

    const buyer = buyers.find((b) => b.id === buyerId) || { name: 'Unknown' }

    return NextResponse.json({ ...newPayment, buyer }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
