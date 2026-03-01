import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import * as SecureStore from 'expo-secure-store'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// ---- Types ----
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export type MeSummary = {
  user: {
    id: string
    email: string | null
    phone: string | null
    role: 'CLIENT' | 'PROFESSIONAL' | 'EMPLOYEE' | 'ADMIN'
    isActive: boolean
    createdAt?: string
  }
  profile: null | {
    id: string
    userId: string
    nickname: string
    gender: string
    ageRange: string
    city: string
    country: string
    allergies: string | null
    comments: string | null
    questionnaire: any | null
    createdAt?: string
    updatedAt?: string
  }
  loyalty: null | {
    tier: LoyaltyTier
    currentPoints: number
    lifetimePoints: number
    pendingDiscount: null | {
      amount: number
      tier: LoyaltyTier | null
      issuedAt: string | null
    }
  }
  defaultPaymentMethod: null | {
    id: string
    type: 'MOMO' | 'CARD' | 'CASH'
    provider: string | null
    label: string | null
    phone: string | null
    last4: string | null
    isDefault: boolean
    createdAt?: string
    updatedAt?: string
  }
}

export type MeLoyalty = {
  account: null | {
    id: string
    userId: string
    tier: LoyaltyTier
    currentPoints: number
    lifetimePoints: number

    pendingDiscountAmount: number
    pendingDiscountTier: LoyaltyTier | null
    pendingDiscountIssuedAt: string | null
    pendingDiscountConsumedAt: string | null
    pendingDiscountConsumedIntentId: string | null

    createdAt?: string
    updatedAt?: string
  }
  pendingDiscount: null | {
    amount: number
    tier: LoyaltyTier | null
    issuedAt: string | null
  }
  transactions: Array<{
    id: string
    deltaPoints: number
    reason: string
    meta: any
    createdAt: string
  }>
}

// ---- Fetchers ----
export async function fetchMeSummary() {
  const res = await api.get<MeSummary>('/me/summary')
  return res.data
}

export async function fetchMeLoyalty() {
  const res = await api.get<MeLoyalty>('/me/loyalty')
  return res.data
}

// ---- React Query hooks ----
// enabled: false tant que pas de token (sinon 401)
export function useMeSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['me', 'summary'],
    queryFn: fetchMeSummary,
    enabled,
    staleTime: 30_000,
  })
}

export function useMeLoyalty(enabled: boolean) {
  return useQuery({
    queryKey: ['me', 'loyalty'],
    queryFn: fetchMeLoyalty,
    enabled,
    staleTime: 30_000,
  })
}

async function authFetch(path: string, init?: RequestInit) {
  const token = await SecureStore.getItemAsync('accessToken')
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useUpdateMeProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) =>
      authFetch('/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me-summary'] })
    },
  })
}
