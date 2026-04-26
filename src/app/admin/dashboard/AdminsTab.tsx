'use client'

import { useCallback, useEffect, useState } from 'react'
import { Label } from './ui'

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_login_at: string | null;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminsTab({ currentEmail }: { currentEmail: string }) {
  const [admins, setAdmins] = useState<AdminUser[] | null>(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/admins', { cache: 'no-store' })
      if (!res.ok) throw new Error('Load failed')
      const body = await res.json()
      setAdmins(body.admins)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault()
    setAddMsg(''); setAdding(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAddMsg(body.error || 'Could not add admin')
      } else {
        setAddMsg(`✓ Added ${body.email}`)
        setEmail(''); setPassword('')
        await load()
      }
    } catch {
      setAddMsg('Network error')
    }
    setAdding(false)
  }

  async function removeAdmin(a: AdminUser) {
    if (!confirm(`Remove ${a.email}? They will no longer be able to sign in.`)) return
    try {
      const res = await fetch(`/api/admin/admins/${encodeURIComponent(a.id)}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { alert(body.error || 'Could not remove admin'); return }
      await load()
    } catch {
      alert('Network error')
    }
  }

  const ok = addMsg.startsWith('✓')

  return (
    <>
      <Label>Add Admin</Label>
      <form
        onSubmit={addAdmin}
        style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div>
          <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', display: 'block', marginBottom: '4px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '14px', fontFamily: 'Inter,sans-serif', color: '#2a2620', background: '#faf7ef', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', display: 'block', marginBottom: '4px' }}>Initial Password (≥12 characters)</label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={12}
            autoComplete="off"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '14px', fontFamily: 'Inter,sans-serif', color: '#2a2620', background: '#faf7ef', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: '11px', color: '#7a7268', marginTop: '6px', lineHeight: 1.5 }}>
            Share this password with them through a secure channel — they can&apos;t change it themselves yet.
          </div>
        </div>

        {addMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '3px', fontSize: '13px', textAlign: 'center', background: ok ? '#e8ede3' : '#fde8e8', color: ok ? '#3d5240' : '#7a2020', border: `1px solid ${ok ? '#c5cfbe' : '#f5b8b8'}` }}>
            {addMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={adding}
          style={{ padding: '12px', background: adding ? '#869a7e' : '#3d5240', color: '#faf7ef', border: 'none', borderRadius: '3px', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
        >
          {adding ? 'Adding…' : 'Add Admin'}
        </button>
      </form>

      <Label>Current Admins</Label>
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#7a7268', fontSize: '13px' }}>Loading…</div>
      )}
      {!loading && admins?.map(a => {
        const isMe = a.email === currentEmail
        return (
          <div
            key={a.id}
            style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '14px 16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '18px', color: '#3d5240', fontWeight: 500 }}>
                {a.email} {isMe && <span style={{ fontSize: '10px', color: '#6b4423', letterSpacing: '1.5px', textTransform: 'uppercase', marginLeft: '6px' }}>(you)</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#7a7268', marginTop: '2px' }}>
                Added {fmtDate(a.created_at)} · Last login {fmtDate(a.last_login_at)}
              </div>
            </div>
            {!isMe && (
              <button
                onClick={() => removeAdmin(a)}
                style={{ padding: '8px 12px', background: 'none', color: '#7a2020', border: '1px solid #f5b8b8', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
              >
                Remove
              </button>
            )}
          </div>
        )
      })}

      <div style={{ paddingBottom: '48px' }} />
    </>
  )
}
