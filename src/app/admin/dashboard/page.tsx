import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import Dashboard from './Dashboard'

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const session = getAdminSession()
  if (!session) {
    redirect('/admin/login?next=/admin/dashboard')
  }
  return <Dashboard adminEmail={session.email} />
}
