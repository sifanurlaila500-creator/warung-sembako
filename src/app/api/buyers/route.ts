import { NextRequest, NextResponse } from 'next/server'
import { getBuyers, getTransactions, createBuyer } from '@/lib/db-prisma'

export async function GET() {
  try {
    const buyers = await getBuyers()
    const transactions = await getTransactions()

    const buyersWithDebt = buyers.map((b: any) => {
      const buyerTx = transactions.filter((t: any) => t.buyerId === b.id && t.type === 'CREDIT')
      const totalDebt = buyerTx.reduce((sum: number, t: any) => sum + (t.totalAmount - t.paidAmount), 0)
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
    if (!body.name) {
      return NextResponse.json({ error: 'Nama harus diisi' }, { status: 400 })
    }
    const buyer = await createBuyer({ name: body.name, phone: body.phone, address: body.address })
    return NextResponse.json(buyer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
