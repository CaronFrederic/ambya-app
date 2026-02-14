import 'dotenv/config'
import fetch from 'node-fetch'
import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const BASE_URL = 'http://localhost:3000'

function mustEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is missing`)
  return v
}

async function main() {
  console.log('🔍 Running APPOINTMENTS API validation...')

  // Register client
  const email = `client_${Date.now()}@ambya.com`
  const password = 'password123'

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role: 'CLIENT' }),
  })

  if (!regRes.ok) throw new Error(`❌ Register failed (${regRes.status})`)
  const reg = await regRes.json()
  const token = reg.accessToken as string
  const userId = reg.user.id as string
  if (!token || !userId) throw new Error('❌ Missing token/user')

  console.log('✅ Register OK')

  // Insert appointment for this client
  const pool = new Pool({ connectionString: mustEnv('DATABASE_URL') })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const pro = await prisma.user.create({
    data: { email: `pro_${Date.now()}@ambya.com`, password: 'x', role: UserRole.PROFESSIONAL },
    select: { id: true },
  })

  const salon = await prisma.salon.create({
    data: { name: 'Salon Test', ownerId: pro.id, city: 'Libreville', country: 'Gabon' },
    select: { id: true },
  })

  const service = await prisma.service.create({
    data: { salonId: salon.id, name: `Service_${Date.now()}`, price: 5000, durationMin: 30 },
    select: { id: true },
  })

  await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: userId,
      serviceId: service.id,
      status: AppointmentStatus.PENDING,
      startAt: new Date(),
      endAt: new Date(Date.now() + 30 * 60000),
    },
  })

  await prisma.$disconnect()
  await pool.end()

  console.log('✅ Appointment created in DB')

  // Call GET /appointments
  const listRes = await fetch(`${BASE_URL}/appointments`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!listRes.ok) throw new Error(`❌ GET /appointments failed (${listRes.status})`)
  const data = await listRes.json()

  if (!data?.items?.length) throw new Error('❌ No appointments returned')

  console.log(`✅ GET /appointments OK (items=${data.items.length})`)
  console.log('\n🎉 APPOINTMENTS API CHECK PASSED')
}

main().catch((e) => {
  console.error('\n🚨 APPOINTMENTS API CHECK FAILED')
  console.error(e.message)
  process.exit(1)
})
