import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardMainPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.role === 'DOCTOR') {
    redirect('/dashboard/doctor')
  } else if (session.role === 'PATIENT') {
    redirect('/dashboard/patient')
  } else {
    redirect('/dashboard/receptionist')
  }
}
