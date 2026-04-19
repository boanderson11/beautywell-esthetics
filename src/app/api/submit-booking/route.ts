import { NextRequest, NextResponse } from 'next/server'

const REPO = 'boanderson11/beautywell-esthetics'
const FILE = 'content/bookings.json'
const GH   = 'https://api.github.com'

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()

    // Read current bookings.json
    const getRes = await fetch(`${GH}/repos/${REPO}/contents/${FILE}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })

    let sha = ''
    let bookings: object[] = []

    if (getRes.ok) {
      const file = await getRes.json()
      sha = file.sha
      const parsed = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
      bookings = parsed.bookings ?? []
    }

    const newBooking = {
      id: `bk_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...body,
    }
    bookings.push(newBooking)

    const putBody: Record<string, string> = {
      message: `New booking: ${body.firstName} ${body.lastName} — ${body.date} ${body.time}`,
      content: Buffer.from(JSON.stringify({ bookings }, null, 2)).toString('base64'),
    }
    if (sha) putBody.sha = sha

    const putRes = await fetch(`${GH}/repos/${REPO}/contents/${FILE}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    })

    if (!putRes.ok) throw new Error('GitHub write failed')

    return NextResponse.json({ success: true, id: newBooking.id })
  } catch (e) {
    console.error('Booking error:', e)
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 })
  }
}
