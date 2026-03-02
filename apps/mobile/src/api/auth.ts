import { api } from './client'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  user: { id: string; role: string; email?: string | null; phone?: string | null }
}

type RegisterDto = {
  email?: string
  phone?: string
  password: string
}

type RegisterResponse = {
  accessToken: string
  user: { id: string; role: 'CLIENT' | 'PROFESSIONAL' | 'EMPLOYEE' | 'ADMIN' }
}

export async function login(payload: LoginPayload) {
  const res = await api.post<LoginResponse>('/auth/login', payload)
  return res.data
}

export async function registerClient(dto: RegisterDto): Promise<RegisterResponse> {
  if (!API_URL) throw new Error('Missing EXPO_PUBLIC_API_URL')

  // ✅ IMPORTANT: adapte l’URL si ton backend utilise un autre path
  // ex: /auth/register, /auth/signup, /auth/client/register ...
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Register failed (${res.status})`)
  }

  return res.json()
}

export async function patchMeProfile(accessToken: string, payload: any) {
  if (!API_URL) throw new Error('Missing EXPO_PUBLIC_API_URL')

  const res = await fetch(`${API_URL}/me/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `PATCH /me/profile failed (${res.status})`)
  }

  return res.json()
}

export async function persistAuth(accessToken: string, role: string) {
  await SecureStore.setItemAsync('accessToken', accessToken)
  await SecureStore.setItemAsync('userRole', role)
}
