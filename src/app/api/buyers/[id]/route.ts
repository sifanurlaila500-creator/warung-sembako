import { getData, setData } from '@/lib/db-store'
import { NextRequest, NextResponse } from 'next/server'

interface Buyer {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const buyers: Buyer[] = await getData('buyers.json')
    const filtered = buyers.filter((b) => b.id !== id)
    if (filtered.length === buyers.length) {
      return NextResponse.json({ error: 'Pembeli tidak ditemukan' }, { status: 404 })
    }
    await setData('buyers.json', filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const buyers: Buyer[] = await getData('buyers.json')
    const idx = buyers.findIndex((b) => b.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Pembeli tidak ditemukan' }, { status: 404 })
    }
    buyers[idx] = {
      ...buyers[idx],
      name: body.name,
      phone: body.phone || '',
      address: body.address || '',
    }
    await setData('buyers.json', buyers)
    return NextResponse.json(buyers[idx])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
