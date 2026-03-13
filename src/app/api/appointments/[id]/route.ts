import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'RECEPTIONIST' && session.role !== 'DOCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const { status, startTime, endTime, reason } = await request.json()

    // Doctors can only update the status (to mark as COMPLETED)
    if (session.role === 'DOCTOR' && (startTime || endTime || reason)) {
      return NextResponse.json({ error: 'Doctors can only update appointment status' }, { status: 403 })
    }

    // Ensure the appointment belongs to the clinic
    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId: session.clinicId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)

      // Clash Detection for Rescheduling
      const conflict = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          clinicId: session.clinicId,
          status: { not: 'CANCELED' },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      })

      if (conflict) {
        return NextResponse.json({ error: 'New time slot results in a clash.' }, { status: 409 })
      }

      return await prisma.appointment.update({
        where: { id },
        data: { startTime: start, endTime: end, status: status || 'BOOKED', reason },
      }).then(res => NextResponse.json(res))
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Ensure the appointment belongs to the clinic
    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId: session.clinicId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
