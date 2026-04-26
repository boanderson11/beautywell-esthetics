import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function AdminLoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f1e8', padding: '24px', fontFamily: 'Inter,sans-serif' }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
