import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // Define public routes
  if (pathname === '/login' || pathname === '/') {
    if (session) {
      try {
        const payload = await decrypt(session)
        if (payload.role === 'DOCTOR') {
          return NextResponse.redirect(new URL('/dashboard/doctor', request.url))
        } else if (payload.role === 'RECEPTIONIST') {
          return NextResponse.redirect(new URL('/dashboard/receptionist', request.url))
        } else if (payload.role === 'PATIENT') {
          return NextResponse.redirect(new URL('/dashboard/patient', request.url))
        }
      } catch (error) {
        // Invalid session, let them stay on public page
      }
    }
    return NextResponse.next()
  }

  // Protected routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const payload = await decrypt(session)
      
      if (pathname.startsWith('/dashboard/doctor') && payload.role !== 'DOCTOR') {
        return NextResponse.redirect(new URL(payload.role === 'PATIENT' ? '/dashboard/patient' : '/dashboard/receptionist', request.url))
      }
      
      if (pathname.startsWith('/dashboard/receptionist') && payload.role !== 'RECEPTIONIST') {
        return NextResponse.redirect(new URL(payload.role === 'PATIENT' ? '/dashboard/patient' : '/dashboard/doctor', request.url))
      }

      if (pathname.startsWith('/dashboard/patient') && payload.role !== 'PATIENT') {
        return NextResponse.redirect(new URL(payload.role === 'DOCTOR' ? '/dashboard/doctor' : '/dashboard/receptionist', request.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}
