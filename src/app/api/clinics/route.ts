import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // A clinic is defined by unique clinicId/clinicName combinations from DOCTOR users
    const clinics = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        clinicId: { not: null },
        clinicName: { not: null }
      },
      select: {
        clinicId: true,
        clinicName: true,
        name: true, // Doctor name
      }
    })

    // Group by clinicId to handle cases where multiple doctors might be in one clinic
    const uniqueClinics = Array.from(new Map(clinics.map(c => [c.clinicId, c])).values())

    return NextResponse.json(uniqueClinics)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clinics' }, { status: 500 })
  }
}
