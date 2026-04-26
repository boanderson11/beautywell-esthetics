'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function logout() {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/admin/login')
      router.refresh()
    }
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      style={{ background: 'none', border: '1px solid rgba(197,207,190,0.35)', color: 'rgba(197,207,190,0.8)', padding: '7px 13px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', borderRadius: '3px', fontFamily: 'inherit' }}
    >
      {busy ? 'Signing out…' : 'Log Out'}
    </button>
  )
}
