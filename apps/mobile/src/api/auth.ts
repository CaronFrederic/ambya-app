import { api } from './client'

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  user: { id: string; role: string; email?: string | null; phone?: string | null }
}

export async function login(payload: LoginPayload) {
  const res = await api.post<LoginResponse>('/auth/login', payload)
  return res.data
}
