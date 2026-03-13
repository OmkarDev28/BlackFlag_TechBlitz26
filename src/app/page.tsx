import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function Home() {
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
