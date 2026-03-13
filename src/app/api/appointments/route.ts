import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') // YYYY-MM-DD

  // If PATIENT, return their own appointments across all clinics
  if (session.role === 'PATIENT') {
    try {
      // Find patient records linked to this user's phone number
      const appointments = await prisma.appointment.findMany({
        where: {
          patient: {
            phone: session.phone
          }
        },
        include: {
          patient: true,
        },
        orderBy: {
          startTime: 'desc',
        },
      })
      
      // Manually add clinic info since it's stored as clinicId on appointment
      // We could add a Clinic model for this, but for now we'll fetch clinic name from User (DOCTOR)
      const clinics = await prisma.user.findMany({
        where: { role: 'DOCTOR' },
        select: { clinicId: true, clinicName: true }
      })
      const clinicMap = new Map(clinics.map(c => [c.clinicId, c.clinicName]))

      const enrichedAppointments = appointments.map(app => ({
        ...app,
        clinicName: clinicMap.get(app.clinicId) || 'Unknown Clinic'
      }))

      return NextResponse.json(enrichedAppointments)
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch your appointments' }, { status: 500 })
    }
  }

  // Clinic Staff view (DOCTOR/RECEPTIONIST)
  if (!dateStr) return NextResponse.json({ error: 'Date is required' }, { status: 400 })

  const startOfDay = new Date(dateStr)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(dateStr)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: session.clinicId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELED' }
      },
      include: {
        patient: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    })
    return NextResponse.json(appointments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { startTime, endTime, reason } = body
    
    let targetClinicId = session.clinicId
    let patientName = body.patientName
    let patientPhone = body.patientPhone

    // If PATIENT is booking, use their own details
    if (session.role === 'PATIENT') {
      targetClinicId = body.clinicId
      patientName = session.name
      patientPhone = session.phone
      if (!targetClinicId) return NextResponse.json({ error: 'clinicId is required for patient booking' }, { status: 400 })
    } else {
      // Clinic staff booking
      if (session.role !== 'RECEPTIONIST') {
        return NextResponse.json({ error: 'Only receptionists can book appointments for others' }, { status: 401 })
      }
    }

    // Phone number validation
    const phoneDigits = patientPhone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      return NextResponse.json({ error: 'Mobile number must be exactly 10 digits.' }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 })
    }

    // Clash Detection Logic (scoped to target clinic)
    const conflict = await prisma.appointment.findFirst({
      where: {
        clinicId: targetClinicId,
        status: { not: 'CANCELED' },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
        ],
      },
    })

    if (conflict) {
      return NextResponse.json({ error: 'This time slot is already booked. Please choose another time.' }, { status: 409 })
    }

    // Find or create patient record in the target clinic
    let patient = await prisma.patient.findFirst({
      where: { 
        phone: patientPhone,
        clinicId: targetClinicId
      },
    })

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: patientName,
          phone: patientPhone,
          clinicId: targetClinicId
        },
      })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        startTime: start,
        endTime: end,
        reason,
        status: 'BOOKED',
        clinicId: targetClinicId
      },
      include: {
        patient: true,
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 })
  }
}
