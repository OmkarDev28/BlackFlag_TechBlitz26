import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { login } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle Patient Registration
    if (body.role === 'PATIENT') {
      const { username, password, name, phone } = body

      if (!username || !password || !name || !phone) {
        return NextResponse.json({ error: 'All fields are required for patient registration' }, { status: 400 })
      }

      const normalizedUsername = username.trim().toLowerCase()
      const existingUser = await prisma.user.findUnique({ where: { username: normalizedUsername } })

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          username: normalizedUsername,
          password: hashedPassword,
          name,
          phone,
          role: 'PATIENT',
        },
      })

      await login({ 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name, 
        phone: user.phone 
      })

      return NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } })
    }

    // Handle Clinic Registration (Doctor + Receptionist)
    const { doctor, receptionist, clinicName } = body

    if (!doctor || !receptionist || !clinicName) {
      return NextResponse.json({ error: 'Doctor, Receptionist and Clinic Name are all required' }, { status: 400 })
    }

    // Validate Doctor fields
    if (!doctor.username || !doctor.password || !doctor.name) {
      return NextResponse.json({ error: 'Doctor details are incomplete' }, { status: 400 })
    }

    // Validate Receptionist fields
    if (!receptionist.username || !receptionist.password || !receptionist.name) {
      return NextResponse.json({ error: 'Receptionist details are incomplete' }, { status: 400 })
    }

    const doctorUsername = doctor.username.trim().toLowerCase();
    const receptionistUsername = receptionist.username.trim().toLowerCase();

    // Check for existing usernames
    const existingDoctor = await prisma.user.findUnique({ where: { username: doctorUsername } })
    const existingReceptionist = await prisma.user.findUnique({ where: { username: receptionistUsername } })

    if (existingDoctor || existingReceptionist) {
      return NextResponse.json({ error: 'One or both usernames already exist' }, { status: 400 })
    }

    if (doctorUsername === receptionistUsername) {
      return NextResponse.json({ error: 'Doctor and Receptionist must have different usernames' }, { status: 400 })
    }

    const hashedDocPassword = await bcrypt.hash(doctor.password, 10)
    const hashedRecPassword = await bcrypt.hash(receptionist.password, 10)

    // Generate a unique Clinic ID
    const clinicId = Math.random().toString(36).substring(2, 12);

    // Create both users in a transaction
    try {
      const [docUser, recUser] = await prisma.$transaction([
        prisma.user.create({
          data: {
            username: doctorUsername,
            password: hashedDocPassword,
            name: doctor.name,
            role: 'DOCTOR',
            clinicId: clinicId,
            clinicName: clinicName,
          },
        }),
        prisma.user.create({
          data: {
            username: receptionistUsername,
            password: hashedRecPassword,
            name: receptionist.name,
            role: 'RECEPTIONIST',
            clinicId: clinicId,
            clinicName: clinicName,
          },
        }),
      ])

      // Log in as the Doctor by default after registration
      await login({ 
        id: docUser.id, 
        username: docUser.username, 
        role: docUser.role, 
        name: docUser.name, 
        clinicId: docUser.clinicId,
        clinicName: docUser.clinicName
      })

      return NextResponse.json({ 
        message: 'Clinic registered successfully',
        doctor: { id: docUser.id, username: docUser.username, role: docUser.role, name: docUser.name, clinicId: docUser.clinicId, clinicName: docUser.clinicName },
        receptionist: { id: recUser.id, username: recUser.username, role: recUser.role, name: recUser.name, clinicId: recUser.clinicId, clinicName: recUser.clinicName }
      })
    } catch (dbError: any) {
      console.error('Database transaction failed:', dbError);
      return NextResponse.json({ error: 'Registration failed during database operation' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: `Registration error: ${error.message}` }, { status: 500 })
  }
}
