import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// The admin app now lives at /admin/dashboard (DB-backed login at /admin/login).
// /admin itself just routes you to the right place.
export default function AdminIndex() {
  if (getAdminSession()) {
    redirect('/admin/dashboard')
  }
  redirect('/admin/login')
}
