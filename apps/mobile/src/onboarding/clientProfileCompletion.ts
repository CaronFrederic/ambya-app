type ClientProfileLike = {
  nickname?: string | null
  gender?: string | null
  ageRange?: string | null
  city?: string | null
  country?: string | null
  allergies?: string | null
  comments?: string | null
  questionnaire?: any | null
}

export type ClientProfileSectionKey =
  | 'general'
  | 'hair'
  | 'nails'
  | 'faceSkin'
  | 'wellness'
  | 'fitness'
  | 'practical'
  | 'important'

export const CLIENT_PROFILE_SECTIONS: Array<{
  key: ClientProfileSectionKey
  title: string
}> = [
  { key: 'general', title: 'Informations générales' },
  { key: 'hair', title: 'Profil capillaire' },
  { key: 'nails', title: 'Ongles' },
  { key: 'faceSkin', title: 'Peau visage' },
  { key: 'wellness', title: 'Bien-être' },
  { key: 'fitness', title: 'Fitness' },
  { key: 'practical', title: 'Préférences pratiques' },
  { key: 'important', title: 'Informations importantes' },
]

function isFilled(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  return value !== null && value !== undefined
}

function sectionFields(profile: ClientProfileLike) {
  const q = (profile.questionnaire ?? {}) as any

  return {
    general: [
      profile.nickname,
      profile.gender,
      profile.ageRange,
      profile.city,
      profile.country,
    ],
    hair: [
      q?.hair?.hairTypes,
      q?.hair?.hairTexture,
      q?.hair?.hairLength,
      q?.hair?.hairConcerns,
    ],
    nails: [
      q?.nails?.nailTypes,
      q?.nails?.nailStates,
      q?.nails?.nailConcerns,
    ],
    faceSkin: [
      q?.face?.faceSkin,
      q?.face?.faceConcerns,
    ],
    wellness: [
      q?.body?.bodySkin ?? q?.body?.skinType,
      q?.body?.tensionZones ?? q?.body?.focusAreas,
      q?.body?.wellbeingConcerns ?? q?.body?.concerns,
    ],
    fitness: [
      q?.fitness?.activityLevel,
      q?.fitness?.fitnessGoals,
      q?.fitness?.fitnessConcerns,
    ],
    practical: [
      q?.practical?.paymentPrefs,
      q?.practical?.notifPrefs,
    ],
    important: [
      profile.allergies,
    ],
  } satisfies Record<ClientProfileSectionKey, unknown[]>
}

export function getClientProfileCompletion(profile?: ClientProfileLike | null) {
  if (!profile) {
    return {
      answered: 0,
      total: 0,
      percentage: 0,
      isComplete: false,
      firstIncomplete: CLIENT_PROFILE_SECTIONS[0],
    }
  }

  const fields = sectionFields(profile)
  let answered = 0
  let total = 0
  let firstIncomplete = CLIENT_PROFILE_SECTIONS[0]

  for (const section of CLIENT_PROFILE_SECTIONS) {
    const sectionValues = fields[section.key]
    const sectionAnswered = sectionValues.filter(isFilled).length

    if (sectionAnswered < sectionValues.length && firstIncomplete.key === CLIENT_PROFILE_SECTIONS[0].key) {
      firstIncomplete = section
    }

    answered += sectionAnswered
    total += sectionValues.length
  }

  const percentage = total === 0 ? 0 : Math.round((answered / total) * 100)
  const isComplete = total > 0 && answered === total
  const incompleteSection =
    CLIENT_PROFILE_SECTIONS.find((section) => {
      const sectionValues = fields[section.key]
      return sectionValues.filter(isFilled).length < sectionValues.length
    }) ?? null

  return {
    answered,
    total,
    percentage,
    isComplete,
    firstIncomplete: incompleteSection,
  }
}
