import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const doctorPassword = await bcrypt.hash('password123', 10)
  const receptionistPassword = await bcrypt.hash('password123', 10)

  // Create default Clinic ID
  const clinicId = 'default-clinic'

  // Create Doctor
  await prisma.user.upsert({
    where: { username: 'dr_smith' },
    update: { clinicId },
    create: {
      username: 'dr_smith',
      password: doctorPassword,
      role: 'DOCTOR',
      name: 'Dr. John Smith',
      clinicId,
    },
  })

  // Create Receptionist
  await prisma.user.upsert({
    where: { username: 'receptionist_amy' },
    update: { clinicId },
    create: {
      username: 'receptionist_amy',
      password: receptionistPassword,
      role: 'RECEPTIONIST',
      name: 'Receptionist Amy',
      clinicId,
    },
  })

  console.log('Seed data created!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
