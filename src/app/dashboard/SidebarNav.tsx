'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Home, Search, Calendar } from 'lucide-react'
import styles from './dashboard.module.css'

export default function SidebarNav({ role, rolePath }: { role: string, rolePath: string }) {
  const pathname = usePathname()

  const links = role === 'PATIENT' ? [
    { href: rolePath, label: 'My Health', icon: Home },
    { href: '/dashboard/patient/book', label: 'Book Visit', icon: Calendar },
  ] : [
    { href: rolePath, label: 'Dashboard', icon: Home },
    { href: '/dashboard/patients', label: 'Patients', icon: Users },
  ]

  return (
    <nav className={styles.nav}>
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href
        return (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <Icon size={20} /> {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
