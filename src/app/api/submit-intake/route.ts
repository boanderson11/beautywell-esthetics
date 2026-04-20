import { NextRequest, NextResponse } from 'next/server'

const REPO = 'boanderson11/beautywell-esthetics'
const FILE = 'content/intakes.json'
const GH   = 'https://api.github.com'

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    // Allow the client-side confirmation to still succeed in local/dev
    // environments where the token isn't configured.
    return NextResponse.json({ success: false, stored: false }, { status: 200 })
  }

  try {
    const body = await req.json()

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
      id: `in_${Date.now()}`,
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

    return NextResponse.json({ success: true, id: newIntake.id })
  } catch (e) {
    console.error('Intake error:', e)
    return NextResponse.json({ error: 'Failed to save intake' }, { status: 500 })
  }
}
