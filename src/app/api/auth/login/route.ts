import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    const accessCode = process.env.ACCESS_CODE

    if (!accessCode) {
      return NextResponse.json({ error: 'ACCESS_CODE belum dikonfigurasi di server' }, { status: 500 })
    }

    if (!code || code !== accessCode) {
      return NextResponse.json({ error: 'Kode akses salah' }, { status: 401 })
    }

    // Set a simple session token
    const token = Buffer.from(`${accessCode}:${Date.now()}`).toString('base64')

    const response = NextResponse.json({ success: true })
    response.cookies.set('warung_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
