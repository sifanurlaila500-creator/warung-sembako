import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('warung_session')?.value
    const accessCode = process.env.ACCESS_CODE

    if (!accessCode) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    // Verify the token contains the access code
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [codePart] = decoded.split(':')
      if (codePart === accessCode) {
        return NextResponse.json({ authenticated: true }, { status: 200 })
      }
    } catch {
      // Invalid token
    }

    return NextResponse.json({ authenticated: false }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}
