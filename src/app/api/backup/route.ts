import { getData, setData } from '@/lib/db-store'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/backup - Export all data
export async function GET() {
  try {
    const buyers = await getData('buyers.json')
    const products = await getData('products.json')
    const transactions = await getData('transactions.json')
    const payments = await getData('payments.json')

    return NextResponse.json({
      buyers,
      products,
      transactions,
      payments,
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/backup - Import all data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.buyers) await setData('buyers.json', body.buyers)
    if (body.products) await setData('products.json', body.products)
    if (body.transactions) await setData('transactions.json', body.transactions)
    if (body.payments) await setData('payments.json', body.payments)

    return NextResponse.json({ success: true, message: 'Data berhasil diimport' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
