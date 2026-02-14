import 'dotenv/config'
import fetch from 'node-fetch'
import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const BASE_URL = 'http://localhost:3000'

function mustEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is missing`)
  return v
}

async function main() {
  console.log('🔍 Running APPOINTMENTS CREATE validation...')

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
  console.log('✅ Register OK')

  const pool = new Pool({ connectionString: mustEnv('DATABASE_URL') })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const pro = await prisma.user.create({
    data: { email: `pro_${Date.now()}@ambya.com`, password: 'x', role: UserRole.PROFESSIONAL },
    select: { id: true },
  })

  const salon = await prisma.salon.create({
    data: { name: 'Ambya Beauty Salon', ownerId: pro.id, city: 'Libreville', country: 'Gabon' },
    select: { id: true },
  })

  const service = await prisma.service.create({
    data: { salonId: salon.id, name: `Service_${Date.now()}`, price: 5000, durationMin: 30 },
    select: { id: true },
  })

  await prisma.$disconnect()
  await pool.end()

  console.log('✅ Salon & Service created')
  console.log(`ℹ️ salonId=${salon.id}`)
  console.log(`ℹ️ serviceId=${service.id}`)

  const startAt = new Date(Date.now() + 60_000).toISOString()

  const createRes = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      salonId: salon.id,
      serviceId: service.id,
      startAt,
      note: 'Test booking',
    }),
  })

  if (!createRes.ok) {
    const txt = await createRes.text()
    throw new Error(`❌ POST /appointments failed (${createRes.status}) ${txt}`)
  }

  const created = await createRes.json()
  if (!created?.id) throw new Error('❌ Missing created id')
  console.log(`✅ POST /appointments OK id=${created.id}`)

  const listRes = await fetch(`${BASE_URL}/appointments`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!listRes.ok) throw new Error(`❌ GET /appointments failed (${listRes.status})`)
  const list = await listRes.json()

  const found = (list.items ?? []).some((a: any) => a.id === created.id)
  if (!found) throw new Error('❌ Created appointment not found in list')

  console.log('✅ Appointment appears in list')
  console.log('\n🎉 APPOINTMENTS CREATE CHECK PASSED')
}

main().catch((e) => {
  console.error('\n🚨 APPOINTMENTS CREATE CHECK FAILED')
  console.error(e.message)
  process.exit(1)
})
