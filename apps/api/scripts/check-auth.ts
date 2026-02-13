import fetch from 'node-fetch'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const BASE_URL = 'http://localhost:3000'

async function main() {
  console.log('🔍 Running AUTH validation...')

  // 1️⃣ Test Register
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test_${Date.now()}@ambya.com`,
      password: 'password123',
    }),
  })

  if (!registerRes.ok) {
    throw new Error('❌ Register failed')
  }

  const registerData = await registerRes.json()
  if (!registerData.accessToken) {
    throw new Error('❌ No JWT returned on register')
  }

  console.log('✅ Register OK')

  // 2️⃣ Test Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: registerData.user.email,
      password: 'password123',
    }),
  })

  if (!loginRes.ok) {
    throw new Error('❌ Login failed')
  }

  const loginData = await loginRes.json()
  if (!loginData.accessToken) {
    throw new Error('❌ No JWT returned on login')
  }

  console.log('✅ Login OK')

  // 3️⃣ Test Protected Route
  console.log('ℹ️ Testing protected route with token...')
  const meRes = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${loginData.accessToken}` },
  })
  console.log('ℹ️ /me status:', meRes.status)

  if (!meRes.ok) {
    throw new Error('❌ Protected route failed')
  }

  console.log('✅ Protected route OK')

  console.log('\n🎉 AUTH CHECK PASSED')
}

main().catch((err) => {
  console.error('\n🚨 AUTH CHECK FAILED')
  console.error(err.message)
  process.exit(1)
})
