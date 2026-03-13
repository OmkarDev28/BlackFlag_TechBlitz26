import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clinicId = searchParams.get('clinicId')
  const dateStr = searchParams.get('date') // YYYY-MM-DD

  if (!clinicId || !dateStr) {
    return NextResponse.json({ error: 'clinicId and date are required' }, { status: 400 })
  }

  const startOfDay = new Date(dateStr)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(dateStr)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELED' }
      },
      select: {
        startTime: true,
        endTime: true,
      }
    })

    return NextResponse.json(bookedAppointments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 })
  }
}
