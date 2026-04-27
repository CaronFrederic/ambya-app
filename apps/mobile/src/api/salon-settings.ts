const API_URL = process.env.EXPO_PUBLIC_API_URL

export type SalonSlot = {
  start: string
  end: string
  enabled: boolean
}

export type SalonSettingsResponse = {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  categories: string[]

  coverImageUrl: string | null
  galleryImageUrls: string[]

  instagramHandle: string
  showInstagramFeed: boolean
  tiktokHandle: string
  showTikTokFeed: boolean
  facebookUrl: string
  websiteUrl: string

  scheduleType: "standard" | "custom"
  standardSlots: SalonSlot[]
  customSlots: Record<string, SalonSlot[]>

  paymentSettings: {
    payMobileMoney: boolean
    payCard: boolean
    payCash: boolean
    orangeMoney: string
    moovMoney: string
    airtelMoney: string
    bankName: string
    iban: string
    bankOwner: string
    cancelPolicyHours: number
  }

  depositEnabled: boolean
  depositPercentage: number
}

export type UpdateSalonSettingsPayload = {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  categories?: string[]

  coverImageUrl?: string | null
  galleryImageUrls?: string[]

  instagramHandle?: string
  showInstagramFeed?: boolean
  tiktokHandle?: string
  showTikTokFeed?: boolean
  facebookUrl?: string
  websiteUrl?: string

  scheduleType: "standard" | "custom"
  standardSlots: SalonSlot[]
  customSlots: Record<string, SalonSlot[]>

  paymentSettings: {
    payMobileMoney: boolean
    payCard: boolean
    payCash: boolean
    orangeMoney?: string
    moovMoney?: string
    airtelMoney?: string
    bankName?: string
    iban?: string
    bankOwner?: string
    cancelPolicyHours?: number
  }

  depositEnabled: boolean
  depositPercentage: number
}

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "API error")
  }

  return response.json()
}

export function getSalonSettings(token: string) {
  return apiFetch<SalonSettingsResponse>("/api/pro/salon-settings", token)
}

export function updateSalonSettings(token: string, payload: UpdateSalonSettingsPayload) {
  return apiFetch<SalonSettingsResponse>("/api/pro/salon-settings", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}