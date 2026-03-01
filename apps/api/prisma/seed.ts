import 'dotenv/config';
import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('🌱 Seeding database...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  const professional = await prisma.user.create({
    data: {
      email: 'pro@ambya.com',
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
    },
  })

  const salon = await prisma.salon.create({
    data: {
      name: 'Ambya Beauty Salon',
      city: 'Libreville',
      country: 'Gabon',
      ownerId: professional.id,
    },
  })

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@ambya.com',
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
    },
  })

  const employee = await prisma.employee.create({
    data: {
      salonId: salon.id,
      userId: employeeUser.id,
      displayName: 'Sarah Coiffeuse',
    },
  })

  const client = await prisma.user.create({
    data: {
      email: 'client@ambya.com',
      password: hashedPassword,
      role: UserRole.CLIENT,
    },
  })

  const service1 = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: 'Coupe Homme',
      price: 5000,
      durationMin: 30,
    },
  })

  await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: service1.id,
      employeeId: employee.id,
      status: AppointmentStatus.PENDING,
      startAt: new Date(),
      endAt: new Date(Date.now() + 30 * 60000),
    },
  })

  await prisma.country.upsert({
  where: { code: 'GA' },
  update: { name: 'Gabon', currency: 'FCFA', isActive: true },
  create: { code: 'GA', name: 'Gabon', currency: 'FCFA', isActive: true },
})

await prisma.country.upsert({
  where: { code: 'CD' },
  update: { name: 'RDC', currency: '$', isActive: true },
  create: { code: 'CD', name: 'RDC', currency: '$', isActive: true },
})


  console.log('✅ Seeding completed successfully')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
