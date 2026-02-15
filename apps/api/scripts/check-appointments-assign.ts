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
  console.log('🔍 Running APPOINTMENTS ASSIGN validation...')

  // Register PRO (owner) via API to get token
  const proEmail = `pro_${Date.now()}@ambya.com`
  const password = 'password123'

  const proReg = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: proEmail, password, role: 'PROFESSIONAL' }),
  })
  if (!proReg.ok) throw new Error(`❌ Pro register failed (${proReg.status})`)
  const pro = await proReg.json()
  const proToken = pro.accessToken as string
  const proId = pro.user.id as string
  console.log('✅ PRO register OK')

  // Setup DB objects
  const pool = new Pool({ connectionString: mustEnv('DATABASE_URL') })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const salon = await prisma.salon.create({
    data: { name: 'Ambya Beauty Salon', ownerId: proId, city: 'Libreville', country: 'Gabon' },
    select: { id: true },
  })

  const employeeUser = await prisma.user.create({
    data: { email: `emp_${Date.now()}@ambya.com`, password: 'x', role: UserRole.EMPLOYEE },
    select: { id: true },
  })

  const employee = await prisma.employee.create({
    data: { salonId: salon.id, userId: employeeUser.id, displayName: 'Employee Test' },
    select: { id: true },
  })

  const clientUser = await prisma.user.create({
    data: { email: `client_${Date.now()}@ambya.com`, password: 'x', role: UserRole.CLIENT },
    select: { id: true },
  })

  const service = await prisma.service.create({
    data: { salonId: salon.id, name: `Service_${Date.now()}`, price: 5000, durationMin: 30 },
    select: { id: true, durationMin: true },
  })

  const appt = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: clientUser.id,
      serviceId: service.id,
      startAt: new Date(Date.now() + 60_000),
      endAt: new Date(Date.now() + 60_000 + service.durationMin * 60_000),
    },
    select: { id: true },
  })

  await prisma.$disconnect()
  await pool.end()

  console.log('✅ Setup OK')
  console.log(`ℹ️ appointmentId=${appt.id}`)
  console.log(`ℹ️ employeeId=${employee.id}`)

  // PATCH assign
  const patchRes = await fetch(`${BASE_URL}/appointments/${appt.id}/assign-employee`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${proToken}`,
    },
    body: JSON.stringify({ employeeId: employee.id }),
  })

  if (!patchRes.ok) {
    const txt = await patchRes.text()
    throw new Error(`❌ PATCH assign failed (${patchRes.status}) ${txt}`)
  }

  const updated = await patchRes.json()
  if (updated.employee?.id !== employee.id) throw new Error('❌ Employee not assigned')

  console.log('✅ Employee assigned')
  console.log('\n🎉 APPOINTMENTS ASSIGN CHECK PASSED')
}

main().catch((e) => {
  console.error('\n🚨 APPOINTMENTS ASSIGN CHECK FAILED')
  console.error(e.message)
  process.exit(1)
})
