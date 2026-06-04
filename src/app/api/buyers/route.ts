import { readData, writeData, generateId } from '@/lib/json-db'
import { NextRequest, NextResponse } from 'next/server'

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
  items: { product: { name: string }; quantity: number; sellPrice: number; subtotal: number }[]
}

interface Payment {
  id: string
  buyerId: string
  amount: number
  date: string
  notes: string
}

export async function GET() {
  try {
    const buyers: Buyer[] = readData('buyers.json')
    const transactions: Transaction[] = readData('transactions.json')
    const payments: Payment[] = readData('payments.json')

    const buyersWithDebt = buyers.map((b) => {
      const buyerTx = transactions.filter((t) => t.buyerId === b.id && t.type === 'CREDIT')
      const totalDebt = buyerTx.reduce((sum, t) => sum + (t.totalAmount - t.paidAmount), 0)
      return { ...b, totalDebt }
    })

    return NextResponse.json(buyersWithDebt)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const buyers: Buyer[] = readData('buyers.json')

    const newBuyer: Buyer = {
      id: generateId(),
      name: body.name,
      phone: body.phone || '',
      address: body.address || '',
      createdAt: new Date().toISOString(),
    }

    buyers.push(newBuyer)
    writeData('buyers.json', buyers)

    return NextResponse.json({ ...newBuyer, totalDebt: 0 }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
