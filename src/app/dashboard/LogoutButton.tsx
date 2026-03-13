'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import styles from './dashboard.module.css'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button onClick={handleLogout} className={styles.logoutBtn} style={{ marginTop: 'auto', marginBottom: '1.5rem' }}>
      <LogOut size={20} style={{ transition: 'transform 0.2s' }} /> Logout
    </button>
  )
}
