import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const buyers = await db.buyer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          where: { status: { in: ['UNPAID', 'PARTIAL'] } },
          select: { totalAmount: true, paidAmount: true },
        },
      },
    })

    const buyersWithDebt = buyers.map((b) => {
      const totalDebt = b.transactions.reduce(
        (sum, t) => sum + (t.totalAmount - t.paidAmount),
        0
      )
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
    const buyer = await db.buyer.create({
      data: {
        name: body.name,
        phone: body.phone || '',
        address: body.address || '',
      },
    })
    return NextResponse.json(buyer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
