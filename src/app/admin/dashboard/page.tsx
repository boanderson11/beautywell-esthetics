import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import LogoutButton from './LogoutButton'

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const session = getAdminSession()
  if (!session) {
    redirect('/admin/login?next=/admin/dashboard')
  }

  return (
    <div style={{ background: '#f5f1e8', minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ background: '#3d5240', color: '#faf7ef', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', fontWeight: 500 }}>
          Beautywell <span style={{ fontFamily: "'Great Vibes',cursive", color: '#8a6a4a', fontStyle: 'normal', fontSize: '30px', verticalAlign: 'middle', letterSpacing: 0 }}>Esthetics</span>
          <span style={{ fontSize: '11px', color: 'rgba(197,207,190,0.75)', letterSpacing: '1.5px', textTransform: 'uppercase', marginLeft: '10px' }}>Admin</span>
        </span>
        <LogoutButton />
      </div>

      <div style={{ padding: '40px 20px', maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '24px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#6b4423', marginBottom: '10px' }}>
            Signed In
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', color: '#3d5240', fontWeight: 500 }}>
            {session.email}
          </div>
          <p style={{ fontSize: '13px', color: '#7a7268', marginTop: '14px', lineHeight: 1.6 }}>
            You are authenticated against the Postgres-backed admin login.
            Content management still happens via Netlify Identity at <code style={{ background: '#f5f1e8', padding: '1px 5px', borderRadius: '2px' }}>/admin</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
