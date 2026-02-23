import React, { createContext, useContext, useMemo, useState } from 'react'

export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Autre'

export type CardPaymentMethod = {
  id: string
  brand?: CardBrand
  last4: string
  expMonth: string
  expYear: string
  holderName?: string
  isDefault?: boolean
}

export type MobileMoneyProvider = 'Airtel Money' | 'Moov Money' | 'Orange Money' | 'MTN' | 'Autre'

export type MobileMoneyMethod = {
  id: string
  provider: MobileMoneyProvider
  phone: string
  holderName?: string
  isDefault?: boolean
}

type PaymentContextValue = {
  // Cards
  cards: CardPaymentMethod[]
  upsertCard: (card: CardPaymentMethod) => void
  removeCard: (id: string) => void
  setDefault: (id: string) => void

  // Mobile Money
  mobileMoney: MobileMoneyMethod[]
  upsertMobileMoney: (mm: MobileMoneyMethod) => void
  removeMobileMoney: (id: string) => void
  setDefaultMobileMoney: (id: string) => void

  // Utils
  reset: () => void
}

const PaymentContext = createContext<PaymentContextValue | null>(null)

const seedCards: CardPaymentMethod[] = [
  {
    id: 'card_1',
    brand: 'Visa',
    last4: '4242',
    expMonth: '12',
    expYear: '28',
    holderName: 'Marie Kouassi',
    isDefault: true,
  },
]

const seedMobileMoney: MobileMoneyMethod[] = [
  // optionnel: tu peux seed ou laisser vide
   {
     id: 'mm_1',
     provider: 'Airtel Money',
     phone: '+24106123456',
     holderName: 'Marie Kouassi',
     isDefault: true,
   },
]

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<CardPaymentMethod[]>(seedCards)
  const [mobileMoney, setMobileMoney] = useState<MobileMoneyMethod[]>(seedMobileMoney)

  const value = useMemo<PaymentContextValue>(
    () => ({
      // -----------------------
      // Cards
      // -----------------------
      cards,
      upsertCard: (card) =>
        setCards((prev) => {
          const exists = prev.some((c) => c.id === card.id)
          if (!exists) return [card, ...prev]
          return prev.map((c) => (c.id === card.id ? { ...c, ...card } : c))
        }),
      removeCard: (id) => setCards((prev) => prev.filter((c) => c.id !== id)),
      setDefault: (id) =>
        setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id }))),

      // -----------------------
      // Mobile Money
      // -----------------------
      mobileMoney,
      upsertMobileMoney: (mm) =>
        setMobileMoney((prev) => {
          const exists = prev.some((m) => m.id === mm.id)
          if (!exists) return [mm, ...prev]
          return prev.map((m) => (m.id === mm.id ? { ...m, ...mm } : m))
        }),
      removeMobileMoney: (id) => setMobileMoney((prev) => prev.filter((m) => m.id !== id)),
      setDefaultMobileMoney: (id) =>
        setMobileMoney((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id }))),

      // -----------------------
      // Reset
      // -----------------------
      reset: () => {
        setCards(seedCards)
        setMobileMoney(seedMobileMoney)
      },
    }),
    [cards, mobileMoney]
  )

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
}

export function usePayment() {
  const ctx = useContext(PaymentContext)
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider')
  return ctx
}