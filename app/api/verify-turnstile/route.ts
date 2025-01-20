// app/api/verify-turnstile/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    const verificationResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: '0x4AAAAAAA5viLzO8M19XYrHG7mCObtKaGo',
          response: token,
        }),
      }
    )

    const verificationResult = await verificationResponse.json()

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: 'Turnstile verification failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}