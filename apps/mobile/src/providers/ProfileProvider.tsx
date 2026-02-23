// src/providers/ProfileProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

export type ProfileGeneral = {
  nickname?: string
  gender?: 'Femme' | 'Homme' | 'Autre' | 'Je ne sais pas'
  ageRange?: '18–24' | '25–34' | '35–44' | '45+' | 'Je ne sais pas'
  city?: string
  country?: string

  // NEW
  email?: string
  phone?: string
}

export type HairProfile = {
  hairType?: string[]
  texture?: string
  length?: string
  concerns?: string[]
}

export type NailsProfile = {
  type?: string[]
  state?: string
  concerns?: string[]
}

export type FaceSkinProfile = {
  skinType?: string
  concerns?: string[]
}

export type WellnessProfile = {
  bodySkinType?: string
  tensionZones?: string[]
  concerns?: string[]
  sensitiveMassageZones?: string
}

export type FitnessProfile = {
  activityLevel?: string
  goals?: string[]
  concerns?: string[]
}

export type PracticalPrefs = {
  paymentModes?: string[] // ["Mobile Money", "Cash"]
  notifications?: string[] // ["Push", "Email"]
}

export type ImportantInfo = {
  allergies?: 'Oui' | 'Non' | 'Je ne sais pas'
  notes?: string
}

export type ProfileData = {
  general: ProfileGeneral
  hair: HairProfile
  nails: NailsProfile
  faceSkin: FaceSkinProfile
  wellness: WellnessProfile
  fitness: FitnessProfile
  practical: PracticalPrefs
  important: ImportantInfo
}

export type SectionKey =
  | 'general'
  | 'hair'
  | 'nails'
  | 'faceSkin'
  | 'wellness'
  | 'fitness'
  | 'practical'
  | 'important'

type ProfileContextValue = {
  data: ProfileData
  patchSection: <K extends SectionKey>(key: K, partial: Partial<ProfileData[K]>) => void
  setSection: <K extends SectionKey>(key: K, value: ProfileData[K]) => void
  reset: () => void
  ready: boolean
}

const STORAGE_KEY = 'ambya_profile_v1'

const defaultProfile: ProfileData = {
  general: {
  nickname: 'Marie',
  gender: 'Femme',
  ageRange: '25–34',
  city: 'Libreville',
  country: 'Gabon',

  email: 'marie.kouassi@example.com',
  phone: '+241 XX XX XX XX',
},
  hair: {
    hairType: ['Bouclés', 'Je ne sais pas'],
    texture: 'Je ne sais pas',
    length: 'Mi-longs',
    concerns: ['Sécheresse', 'Frisottis', 'Je ne sais pas'],
  },
  nails: {
    type: ['Lisses', 'Je ne sais pas'],
    state: 'Ongles normaux',
    concerns: ['Cuticules', 'Je ne sais pas'],
  },
  faceSkin: {
    skinType: 'Mixte',
    concerns: ['Taches', 'Déshydratation', 'Je ne sais pas'],
  },
  wellness: {
    bodySkinType: 'Je ne sais pas',
    tensionZones: ['Épaules', 'Dos', 'Je ne sais pas'],
    concerns: ['Stress', 'Relaxation'],
    sensitiveMassageZones: 'Aucune sélection',
  },
  fitness: {
    activityLevel: 'Occasionnel',
    goals: ['Condition générale', 'Je ne sais pas'],
    concerns: ['Posture / mobilité', 'Je ne sais pas'],
  },
  practical: {
    paymentModes: ['Mobile Money', 'Cash'],
    notifications: ['Push', 'Email'],
  },
  important: {
    allergies: 'Non',
    notes: '',
  },
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProfileData>(defaultProfile)
  const [ready, setReady] = useState(false)

  // Load persisted profile
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY)
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as ProfileData
          // merge soft with defaults (in case new fields are added later)
          setData({
            ...defaultProfile,
            ...parsed,
            general: { ...defaultProfile.general, ...(parsed.general ?? {}) },
            hair: { ...defaultProfile.hair, ...(parsed.hair ?? {}) },
            nails: { ...defaultProfile.nails, ...(parsed.nails ?? {}) },
            faceSkin: { ...defaultProfile.faceSkin, ...(parsed.faceSkin ?? {}) },
            wellness: { ...defaultProfile.wellness, ...(parsed.wellness ?? {}) },
            fitness: { ...defaultProfile.fitness, ...(parsed.fitness ?? {}) },
            practical: { ...defaultProfile.practical, ...(parsed.practical ?? {}) },
            important: { ...defaultProfile.important, ...(parsed.important ?? {}) },
          })
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setReady(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const persist = async (next: ProfileData) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const value = useMemo<ProfileContextValue>(
    () => ({
      data,
      ready,
      patchSection: (key, partial) => {
        setData((d) => {
          const next = {
            ...d,
            [key]: { ...(d as any)[key], ...(partial ?? {}) },
          } as ProfileData
          void persist(next)
          return next
        })
      },
      setSection: (key, value) => {
        setData((d) => {
          const next = { ...d, [key]: value } as ProfileData
          void persist(next)
          return next
        })
      },
      reset: () => {
        setData(defaultProfile)
        void persist(defaultProfile)
      },
    }),
    [data, ready]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}