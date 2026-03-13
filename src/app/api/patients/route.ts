import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const patients = await prisma.patient.findMany({
      where: {
        clinicId: session.clinicId
      },
      include: {
        _count: {
          select: { appointments: true }
        },
        appointments: {
          where: {
            clinicId: session.clinicId
          },
          orderBy: { startTime: 'desc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(patients)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}
