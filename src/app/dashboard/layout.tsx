import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { User as UserIcon, Building2 } from 'lucide-react'
import LogoutButton from './LogoutButton'
import SidebarNav from './SidebarNav'
import styles from './dashboard.module.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  let rolePath = '/dashboard/receptionist'
  if (session.role === 'DOCTOR') rolePath = '/dashboard/doctor'
  if (session.role === 'PATIENT') rolePath = '/dashboard/patient'

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>MediSync Clinic OS</div>
        
        <div style={{ padding: '0 2rem', marginBottom: '2.5rem' }}>
          {session.role !== 'PATIENT' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#38bdf8', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              <Building2 size={18} />
              <span style={{ fontWeight: 800 }}>{session.clinicName || 'My Clinic'}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            <UserIcon size={16} />
            <span style={{ fontWeight: 600, color: 'white' }}>{session.name}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '1.75rem' }}>
            {session.role.charAt(0) + session.role.slice(1).toLowerCase()}
          </div>
        </div>

        <SidebarNav role={session.role} rolePath={rolePath} />
        
        <LogoutButton />
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
