import 'dotenv/config'
import { PrismaClient, AppointmentStatus, UserRole, Employee, Service } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

const SALON_COUNT = Number(process.env.FAKE_SALONS_COUNT ?? 8)
const EMPLOYEES_PER_SALON = Number(process.env.FAKE_EMPLOYEES_PER_SALON ?? 4)
const SERVICES_PER_SALON = Number(process.env.FAKE_SERVICES_PER_SALON ?? 8)
const APPOINTMENTS_PER_SALON = Number(process.env.FAKE_APPOINTMENTS_PER_SALON ?? 10)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})

const cities = ['Libreville', 'Port-Gentil', 'Franceville', 'Owendo', 'Lambaréné']
const salonPrefixes = ['Élégance', 'Belleza', 'Glow', 'Prestige', 'Zen', 'Nubia', 'Aura', 'Velvet']
const serviceCatalog = [
  { name: 'Coupe Femme', basePrice: 12000, durationMin: 45 },
  { name: 'Brushing', basePrice: 10000, durationMin: 40 },
  { name: 'Coloration', basePrice: 25000, durationMin: 90 },
  { name: 'Massage Relaxant', basePrice: 20000, durationMin: 60 },
  { name: 'Massage Deep Tissue', basePrice: 28000, durationMin: 90 },
  { name: 'Manucure', basePrice: 9000, durationMin: 35 },
  { name: 'Pédicure', basePrice: 11000, durationMin: 45 },
  { name: 'Soin du visage', basePrice: 18000, durationMin: 60 },
  { name: 'Maquillage Soirée', basePrice: 22000, durationMin: 70 },
  { name: 'Lissage', basePrice: 30000, durationMin: 120 },
]

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function jitterPrice(price: number) {
  const factor = 0.85 + Math.random() * 0.4
  return Math.max(3000, Math.round(price * factor))
}

function randomPastDate(daysBackMax: number) {
  const now = Date.now()
  const backMs = Math.floor(Math.random() * daysBackMax * 24 * 60 * 60 * 1000)
  return new Date(now - backMs)
}

function randomFutureDate(daysAheadMax: number) {
  const now = Date.now()
  const aheadMs = Math.floor(Math.random() * daysAheadMax * 24 * 60 * 60 * 1000)
  return new Date(now + aheadMs)
}

async function ensureReferenceCountries() {
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
}

async function main() {
  console.log('🌱 Generating fake salons/services/employees ...')
  console.log(`- salons: ${SALON_COUNT}`)
  console.log(`- employees/salon: ${EMPLOYEES_PER_SALON}`)
  console.log(`- services/salon: ${SERVICES_PER_SALON}`)
  console.log(`- appointments/salon: ${APPOINTMENTS_PER_SALON}`)

  await ensureReferenceCountries()

  const passwordHash = await bcrypt.hash('password123', 10)
  const runTag = Date.now()

  const demoClient = await prisma.user.upsert({
    where: { email: 'client+fake@ambya.com' },
    update: { password: passwordHash, role: UserRole.CLIENT, isActive: true },
    create: {
      email: 'client+fake@ambya.com',
      password: passwordHash,
      role: UserRole.CLIENT,
    },
  })

  for (let i = 0; i < SALON_COUNT; i++) {
    const ownerEmail = `pro+fake-${runTag}-${i}@ambya.com`
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: passwordHash,
        role: UserRole.PROFESSIONAL,
        isActive: true,
      },
    })

    const city = pick(cities)
    const salon = await prisma.salon.create({
      data: {
        name: `${pick(salonPrefixes)} Beauty #${i + 1}`,
        description: `Salon test #${i + 1} pour navigation discovery et prise de rendez-vous.`,
        address: `${10 + i} Boulevard Demo`,
        city,
        country: 'Gabon',
        phone: `+241 77 00 ${String(10 + i).padStart(2, '0')}`,
        ownerId: owner.id,
      },
    })

    const employees: Employee[] = []
    for (let e = 0; e < EMPLOYEES_PER_SALON; e++) {
      const employeeUser = await prisma.user.create({
        data: {
          email: `employee+fake-${runTag}-${i}-${e}@ambya.com`,
          password: passwordHash,
          role: UserRole.EMPLOYEE,
          isActive: true,
        },
      })

      const employee = await prisma.employee.create({
        data: {
          salonId: salon.id,
          userId: employeeUser.id,
          displayName: `Employé ${i + 1}-${e + 1}`,
          isActive: true,
        },
      })
      employees.push(employee)
    }

    const chosenServices = [...serviceCatalog]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(SERVICES_PER_SALON, serviceCatalog.length))

    const services: Service[] = []
    for (const svc of chosenServices) {
      const service = await prisma.service.create({
        data: {
          salonId: salon.id,
          name: svc.name,
          description: `${svc.name} - service de démonstration`,
          price: jitterPrice(svc.basePrice),
          durationMin: svc.durationMin,
          isActive: true,
        },
      })
      services.push(service)
    }

    for (let a = 0; a < APPOINTMENTS_PER_SALON; a++) {
      const employee = pick(employees)
      const service = pick(services)
      const isPast = a < Math.floor(APPOINTMENTS_PER_SALON * 0.6)
      const startAt = isPast ? randomPastDate(60) : randomFutureDate(14)
      const endAt = new Date(startAt.getTime() + service.durationMin * 60_000)

      await prisma.appointment.create({
        data: {
          salonId: salon.id,
          clientId: demoClient.id,
          serviceId: service.id,
          employeeId: employee.id,
          status: isPast ? AppointmentStatus.COMPLETED : AppointmentStatus.PENDING,
          startAt,
          endAt,
          note: 'RDV généré automatiquement (seed fake)',
        },
      })
    }
  }

  console.log('✅ Fake data generation done')
  console.log(`Comptes pro créés: email pattern pro+fake-${runTag}-<index>@ambya.com`) 
  console.log('Mot de passe de test: password123')
}

main()
  .catch((error) => {
    console.error('❌ Fake data generation failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
