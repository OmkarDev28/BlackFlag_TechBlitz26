import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AppointmentsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  // Redirect to role-specific dashboard which already manages appointments
  if (session.role === 'DOCTOR') {
    redirect('/dashboard/doctor')
  } else {
    redirect('/dashboard/receptionist')
  }
}
