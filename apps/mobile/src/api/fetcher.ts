import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL

if (!BASE_URL) {
  // On évite de throw ici pour ne pas casser Metro au build
  console.warn('⚠️ EXPO_PUBLIC_API_URL is missing in apps/mobile/.env')
}

type FetchOptions = RequestInit & { auth?: boolean }

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `${path}`}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as any),
  }

  if (opts.auth) {
    const token = await SecureStore.getItemAsync('accessToken')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { ...opts, headers })

  // try parse json error
  let body: any = null
  const text = await res.text()
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    const msg = body?.message ?? `HTTP ${res.status}`
    const err: any = new Error(msg)
    err.status = res.status
    err.body = body
    throw err
  }

  return body as T
}
