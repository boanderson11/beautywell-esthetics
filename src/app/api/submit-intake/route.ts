import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const REPO = 'boanderson11/beautywell-esthetics'
const FILE = 'content/intakes.json'
const GH   = 'https://api.github.com'

export async function POST(req: NextRequest) {
  let body: { email?: string; firstName?: string; lastName?: string } & Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const intakeId = `in_${Date.now()}`

  // Try to link this intake to the client's next upcoming confirmed booking.
  // Soft-fails: if the DB isn't reachable or no matching booking exists, we
  // still proceed to store the intake so the client's submission isn't lost.
  if (body.email) {
    try {
      const sql = db()
      await sql`
        UPDATE bookings
        SET intake_completed_at = now(),
            intake_id = ${intakeId}
        WHERE id = (
          SELECT id FROM bookings
          WHERE lower(email) = lower(${body.email})
            AND status = 'confirmed'
            AND intake_completed_at IS NULL
            AND date >= CURRENT_DATE
          ORDER BY date ASC, time_slot ASC
          LIMIT 1
        )
      `
    } catch (err) {
      console.error('[submit-intake] booking link failed', err)
    }
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    // Allow the client-side confirmation to still succeed in local/dev
    // environments where the token isn't configured.
    return NextResponse.json({ success: true, stored: false, id: intakeId }, { status: 200 })
  }

  try {
    const getRes = await fetch(`${GH}/repos/${REPO}/contents/${FILE}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })

    let sha = ''
    let intakes: object[] = []

    if (getRes.ok) {
      const file = await getRes.json()
      sha = file.sha
      const parsed = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
      intakes = parsed.intakes ?? []
    }

    const newIntake = {
      id: intakeId,
      createdAt: new Date().toISOString(),
      ...body,
    }
    intakes.push(newIntake)

    const putBody: Record<string, string> = {
      message: `New intake form: ${body.firstName ?? ''} ${body.lastName ?? ''}`.trim(),
      content: Buffer.from(JSON.stringify({ intakes }, null, 2)).toString('base64'),
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

    return NextResponse.json({ success: true, id: intakeId })
  } catch (e) {
    console.error('Intake error:', e)
    return NextResponse.json({ error: 'Failed to save intake' }, { status: 500 })
  }
}
