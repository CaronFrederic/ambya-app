import React, { createContext, useContext, useMemo, useState } from 'react'

export type ProfileGeneral = {
  nickname?: string
  gender?: 'Femme' | 'Homme' | 'Autre' | 'Je ne sais pas'
  ageRange?: '18–24' | '25–34' | '35–44' | '45+' | 'Je ne sais pas'
  city?: string
  country?: string
}

export type HairProfile = {
  hairType?: string[] // ex: ["Bouclés", "Je ne sais pas"]
  texture?: string
  length?: string
  concerns?: string[] // ex: ["Sécheresse", "Frisottis"]
}

export type NailsProfile = {
  type?: string[] // ["Lisses", "Je ne sais pas"]
  state?: string // "Ongles normaux"
  concerns?: string[] // ["Cuticules"]
}

export type FaceSkinProfile = {
  skinType?: string // "Mixte"
  concerns?: string[] // ["Taches", "Déshydratation"]
}

export type WellnessProfile = {
  bodySkinType?: string
  tensionZones?: string[] // ["Épaules", "Dos"]
  concerns?: string[] // ["Stress", "Relaxation"]
  sensitiveMassageZones?: string // "Aucune sélection"
}

export type FitnessProfile = {
  activityLevel?: string // "Occasionnel"
  goals?: string[] // ["Condition générale"]
  concerns?: string[] // ["Posture / mobilité"]
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

type SectionKey =
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
  patchSection: (key: SectionKey, partial: any) => void
  reset: () => void
}

const defaultProfile: ProfileData = {
  general: {
    nickname: 'Marie',
    gender: 'Femme',
    ageRange: '25–34',
    city: 'Libreville',
    country: 'Gabon',
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

  const value = useMemo<ProfileContextValue>(
    () => ({
      data,
      patchSection: (key, partial) =>
        setData((d) => ({
          ...d,
          [key]: { ...(d as any)[key], ...(partial ?? {}) },
        })),
      reset: () => setData(defaultProfile),
    }),
    [data]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

export type { SectionKey }
