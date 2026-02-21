import React, { createContext, useContext, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  duration?: number
  quantity?: number
}

export type BookingDraft = {
  cart: CartItem[]
  salonId?: string
  salonName?: string

  // schedule
  date?: { day: string; date: number } // simple pour coller à la maquette
  time?: string
  professionalName?: string // “Pas de préférence” possible

  // payment
  depositEnabled?: boolean
  depositPercentage?: number
  paymentChoice?: 'full' | 'deposit'
  paymentMethod?: 'card' | 'mobile_money' | 'cash'
  operator?: string
}

type BookingContextValue = {
  draft: BookingDraft
  setCart: (cart: CartItem[]) => void
  patch: (partial: Partial<BookingDraft>) => void
  reset: () => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>({
    cart: [],
    depositEnabled: true,
    depositPercentage: 30,
    paymentChoice: 'full',
  })

  const value = useMemo<BookingContextValue>(
    () => ({
      draft,
      setCart: (cart) => setDraft((d) => ({ ...d, cart })),
      patch: (partial) => setDraft((d) => ({ ...d, ...partial })),
      reset: () =>
        setDraft({
          cart: [],
          depositEnabled: true,
          depositPercentage: 30,
          paymentChoice: 'full',
        }),
    }),
    [draft]
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
