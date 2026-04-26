'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/admin/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Login failed')
        setSubmitting(false)
        return
      }
      router.replace(next)
      router.refresh()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: '360px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', color: '#3d5240', marginBottom: '4px', fontWeight: 300 }}>
          Beautywell <span style={{ fontFamily: "'Great Vibes',cursive", color: '#6b4423', fontStyle: 'normal', fontSize: '48px', verticalAlign: 'middle', letterSpacing: 0 }}>Esthetics</span>
        </div>
        <div style={{ fontSize: '11px', color: '#7a7268', letterSpacing: '3px', textTransform: 'uppercase' }}>Admin Sign In</div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', display: 'block', marginBottom: '6px' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '15px', fontFamily: 'Inter,sans-serif', color: '#2a2620', background: '#fff', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', display: 'block', marginBottom: '6px' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '15px', fontFamily: 'Inter,sans-serif', color: '#2a2620', background: '#fff', boxSizing: 'border-box' }}
        />
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fde8e8', color: '#7a2020', border: '1px solid #f5b8b8', borderRadius: '3px', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{ width: '100%', padding: '16px', background: submitting ? '#869a7e' : '#3d5240', color: '#faf7ef', border: 'none', fontSize: '12px', letterSpacing: '2.5px', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', borderRadius: '3px', fontFamily: 'inherit', fontWeight: 500 }}
      >
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}
