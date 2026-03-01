// app/(screens)/edit-section.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useQueryClient } from '@tanstack/react-query'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { useMeSummary } from '../../src/api/me'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

/**
 * ✅ Objectif :
 * - 100% dynamique (source = /me/summary)
 * - toutes les sections manquantes (nails, faceSkin, wellness, fitness, practical)
 * - choix multiples en chips, LIMITÉ À 3 (max=3 pour tous les multi)
 *
 * ⚠️ IMPORTANT :
 * - Adapte API_URL + endpoint PATCH si ton backend a une route différente.
 *   Ici on suppose : PATCH /me/profile
 */

type SectionKey =
  | 'general'
  | 'hair'
  | 'nails'
  | 'faceSkin'
  | 'wellness'
  | 'fitness'
  | 'practical'
  | 'important'

type Option = { label: string; value: string }
type Chip = { label: string; value: string }

const MAX_MULTI = 3

// ---------- OPTIONS (copiées de l’inscription) ----------
const GENDER_OPTIONS: Option[] = [
  { label: 'Femme', value: 'female' },
  { label: 'Homme', value: 'male' },
  { label: 'Autre', value: 'other' },
  { label: 'Préfère ne pas dire', value: 'na' },
]

const AGE_OPTIONS: Option[] = [
  { label: '18–24 ans', value: '18-24' },
  { label: '25–34 ans', value: '25-34' },
  { label: '35–44 ans', value: '35-44' },
  { label: '45–54 ans', value: '45-54' },
  { label: '55 ans et plus', value: '55+' },
]

const HAIR_TYPES: Chip[] = [
  { label: 'Raides', value: 'straight' },
  { label: 'Ondulés', value: 'wavy' },
  { label: 'Bouclés', value: 'curly' },
  { label: 'Crépus', value: 'coily' },
  { label: 'Locks', value: 'locks' },
  { label: 'Extensions', value: 'extensions' },
  { label: 'Autres', value: 'other' },
]

const HAIR_TEXTURE_OPTIONS: Option[] = [
  { label: 'Fins', value: 'thin' },
  { label: 'Moyens', value: 'medium' },
  { label: 'Épais', value: 'thick' },
  { label: 'Très épais', value: 'very_thick' },
  { label: 'Je ne sais pas', value: 'na' },
]

const HAIR_LENGTH_OPTIONS: Option[] = [
  { label: 'Très courts', value: 'very_short' },
  { label: 'Courts', value: 'short' },
  { label: 'Mi-longs', value: 'medium' },
  { label: 'Longs', value: 'long' },
  { label: 'Je ne sais pas', value: 'na' },
]

const HAIR_CONCERNS: Chip[] = [
  { label: 'Chute', value: 'fall' },
  { label: 'Sécheresse', value: 'dry' },
  { label: 'Casse', value: 'break' },
  { label: 'Frisottis', value: 'frizz' },
  { label: 'Pellicules', value: 'dandruff' },
  { label: 'Croissance', value: 'growth' },
  { label: 'Manque de volume', value: 'volume' },
  { label: 'Sensibilité du cuir chevelu', value: 'scalp_sensitive' },
  { label: 'Je ne sais pas', value: 'na' },
]

const NAIL_TYPE_MAX2: Chip[] = [
  { label: 'Lisses', value: 'smooth' },
  { label: 'Striés', value: 'ridged' },
  { label: 'Délicats', value: 'delicate' },
  { label: 'Irréguliers', value: 'irregular' },
  { label: 'Dur', value: 'hard' },
  { label: 'Fragiles', value: 'fragile' },
  { label: 'Je ne sais pas', value: 'na' },
]

const NAIL_STATE_MAX2: Chip[] = [
  { label: 'Cassants', value: 'brittle' },
  { label: 'Mou', value: 'soft' },
  { label: 'Ongles qui se dédoublent', value: 'split' },
  { label: 'Irrités', value: 'irritated' },
  { label: 'Ongles normaux', value: 'normal' },
  { label: 'Je ne sais pas', value: 'na' },
]

const NAIL_CONCERNS_MAX3: Chip[] = [
  { label: 'Cuticules', value: 'cuticles' },
  { label: 'Déshydratation', value: 'dehydration' },
  { label: 'Lourdeur', value: 'heaviness' },
  { label: 'Ongles courts', value: 'short' },
  { label: 'Ongles rongés', value: 'bitten' },
  { label: 'Allergies produits', value: 'product_allergy' },
  { label: 'Je ne sais pas', value: 'na' },
]

const FACE_SKIN_OPTIONS: Option[] = [
  { label: 'Sèche', value: 'dry' },
  { label: 'Mixte', value: 'combo' },
  { label: 'Grasse', value: 'oily' },
  { label: 'Sensible', value: 'sensitive' },
  { label: 'Normale', value: 'normal' },
  { label: 'Je ne sais pas', value: 'na' },
]

const FACE_CONCERNS_MAX3: Chip[] = [
  { label: 'Acné', value: 'acne' },
  { label: 'Rougeurs', value: 'redness' },
  { label: 'Taches', value: 'spots' },
  { label: 'Sensibilité', value: 'sensitivity' },
  { label: 'Déshydratation', value: 'dehydration' },
  { label: 'Rides & vieillissement', value: 'aging' },
  { label: 'Texture', value: 'texture' },
  { label: "Manque d'éclat", value: 'dull' },
  { label: 'Je ne sais pas', value: 'na' },
]

const BODY_SKIN_OPTIONS: Option[] = [
  { label: 'Normale', value: 'normal' },
  { label: 'Sèche', value: 'dry' },
  { label: 'Sensible', value: 'sensitive' },
  { label: 'Je ne sais pas', value: 'na' },
]

const TENSION_ZONES_MAX3: Chip[] = [
  { label: 'Nuque', value: 'neck' },
  { label: 'Épaules', value: 'shoulders' },
  { label: 'Dos', value: 'back' },
  { label: 'Lombaires', value: 'lower_back' },
  { label: 'Bras', value: 'arms' },
  { label: 'Jambes', value: 'legs' },
  { label: 'Pieds', value: 'feet' },
  { label: 'Je ne sais pas', value: 'na' },
]

const WELLBEING_CONCERNS_MAX3: Chip[] = [
  { label: 'Stress', value: 'stress' },
  { label: 'Douleurs musculaires', value: 'muscle_pain' },
  { label: 'Circulation', value: 'circulation' },
  { label: 'Détox', value: 'detox' },
  { label: "Rétention d'eau", value: 'water_retention' },
  { label: 'Relaxation', value: 'relax' },
  { label: 'Je ne sais pas', value: 'na' },
]

const MASSAGE_SENSITIVE_ZONES_OPTIONAL: Chip[] = [
  { label: 'Nuque', value: 'neck' },
  { label: 'Épaules', value: 'shoulders' },
  { label: 'Dos', value: 'back' },
  { label: 'Lombaires', value: 'lower_back' },
  { label: 'Bras', value: 'arms' },
  { label: 'Jambes', value: 'legs' },
  { label: 'Pieds', value: 'feet' },
]

const ACTIVITY_LEVEL_OPTIONS: Option[] = [
  { label: 'Sédentaire', value: 'sedentary' },
  { label: 'Occasionnel', value: 'occasional' },
  { label: 'Régulier', value: 'regular' },
  { label: 'Sportif', value: 'sporty' },
  { label: 'Je ne sais pas', value: 'na' },
]

const FITNESS_GOALS_MAX2: Chip[] = [
  { label: 'Prise de muscle', value: 'muscle' },
  { label: 'Perte de poids', value: 'weight_loss' },
  { label: 'Endurance', value: 'endurance' },
  { label: 'Condition générale', value: 'fitness' },
  { label: 'Remise en forme', value: 'back_in_shape' },
  { label: 'Je ne sais pas', value: 'na' },
]

const FITNESS_CONCERNS_MAX3: Chip[] = [
  { label: 'Douleurs articulaires', value: 'joint_pain' },
  { label: 'Cardio faible', value: 'low_cardio' },
  { label: 'Essoufflement', value: 'breath' },
  { label: 'Récupération lente', value: 'slow_recovery' },
  { label: 'Fatigue', value: 'fatigue' },
  { label: 'Posture / mobilité', value: 'posture' },
  { label: 'Je ne sais pas', value: 'na' },
]

const PAYMENT_MAX2: Chip[] = [
  { label: 'Mobile Money', value: 'momo' },
  { label: 'Carte bancaire', value: 'card' },
  { label: 'Cash', value: 'cash' },
  { label: 'Mixte', value: 'mixed' },
]

const NOTIF_MAX2: Chip[] = [
  { label: 'Push', value: 'push' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Aucun', value: 'none' },
]

const ALLERGIES_OPTIONS: Option[] = [
  { label: 'Oui', value: 'yes' },
  { label: 'Non', value: 'no' },
]

// ---------- Helpers ----------
function clampSelect(list: string[], value: string, max: number) {
  const exists = list.includes(value)
  if (exists) return list.filter((v) => v !== value)
  if (list.length >= max) return list
  return [...list, value]
}

function toUpperCurrencyOrNull(v: string | null | undefined) {
  const s = (v ?? '').trim()
  return s ? s.toUpperCase() : null
}

// ---------- API ----------
async function patchMeProfile(token: string, body: any) {
  const api = process.env.EXPO_PUBLIC_API_URL
  if (!api) {
    throw new Error('EXPO_PUBLIC_API_URL missing')
  }

  const res = await fetch(`${api}/me/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json().catch(() => ({}))
}

export default function EditSectionScreen() {
  const qc = useQueryClient()
  const params = useLocalSearchParams<{ section?: string; title?: string }>()
  const section = (params.section ?? 'general') as SectionKey
  const screenTitle = (params.title ?? 'Modifier') as string

  const [token, setToken] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then(setToken)
  }, [])

  const { data: summary, isLoading, refetch } = useMeSummary(!!token)
  const profile = summary?.profile
  const user = summary?.user
  const q = (profile?.questionnaire ?? {}) as any

  // ---- local form state (dynamique) ----
  // general
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')

  // hair
  const [hairTypes, setHairTypes] = useState<string[]>([])
  const [hairTexture, setHairTexture] = useState<string | null>(null)
  const [hairLength, setHairLength] = useState<string | null>(null)
  const [hairConcerns, setHairConcerns] = useState<string[]>([])

  // nails
  const [nailTypes, setNailTypes] = useState<string[]>([])
  const [nailStates, setNailStates] = useState<string[]>([])
  const [nailConcerns, setNailConcerns] = useState<string[]>([])

  // face
  const [faceSkin, setFaceSkin] = useState<string | null>(null)
  const [faceConcerns, setFaceConcerns] = useState<string[]>([])

  // wellness
  const [bodySkin, setBodySkin] = useState<string | null>(null)
  const [tensionZones, setTensionZones] = useState<string[]>([])
  const [wellbeingConcerns, setWellbeingConcerns] = useState<string[]>([])
  const [massageSensitiveZones, setMassageSensitiveZones] = useState<string[]>([])

  // fitness
  const [activityLevel, setActivityLevel] = useState<string | null>(null)
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([])
  const [fitnessConcerns, setFitnessConcerns] = useState<string[]>([])

  // practical
  const [paymentPrefs, setPaymentPrefs] = useState<string[]>([])
  const [notifPrefs, setNotifPrefs] = useState<string[]>([])

  // important
  const [allergies, setAllergies] = useState<string | null>(null)
  const [comments, setComments] = useState('')

  // Init form from back
  useEffect(() => {
    if (!profile) return

    // general
    setNickname(profile.nickname ?? '')
    setGender(profile.gender ?? null)
    setAgeRange(profile.ageRange ?? null)
    setCity(profile.city ?? '')
    setCountry(profile.country ?? '')

    // hair
    setHairTypes(q?.hair?.hairTypes ?? [])
    setHairTexture(q?.hair?.hairTexture ?? null)
    setHairLength(q?.hair?.hairLength ?? null)
    setHairConcerns(q?.hair?.hairConcerns ?? [])

    // nails
    setNailTypes(q?.nails?.nailTypes ?? [])
    setNailStates(q?.nails?.nailStates ?? [])
    setNailConcerns(q?.nails?.nailConcerns ?? [])

    // face
    setFaceSkin(q?.face?.faceSkin ?? null)
    setFaceConcerns(q?.face?.faceConcerns ?? [])

    // wellness
    setBodySkin(q?.body?.bodySkin ?? null)
    setTensionZones(q?.body?.tensionZones ?? [])
    setWellbeingConcerns(q?.body?.wellbeingConcerns ?? [])
    setMassageSensitiveZones(q?.body?.massageSensitiveZones ?? [])

    // fitness
    setActivityLevel(q?.fitness?.activityLevel ?? null)
    setFitnessGoals(q?.fitness?.fitnessGoals ?? [])
    setFitnessConcerns(q?.fitness?.fitnessConcerns ?? [])

    // practical
    setPaymentPrefs(q?.practical?.paymentPrefs ?? [])
    setNotifPrefs(q?.practical?.notifPrefs ?? [])

    // important
    setAllergies(profile.allergies ?? null)
    setComments(profile.comments ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]) // init once per profile

  const userInfo = useMemo(() => {
    return {
      email: user?.email ?? null,
      phone: user?.phone ?? null,
    }
  }, [user?.email, user?.phone])

  const canSave = !!token && !saving

  async function onSave() {
    if (!token) return

    // validations légères
    if (section === 'general') {
      if (!nickname.trim()) return Alert.alert('Champ requis', 'Indique ton prénom ou surnom.')
      if (!gender) return Alert.alert('Champ requis', 'Sélectionne ton genre.')
      if (!ageRange) return Alert.alert('Champ requis', "Sélectionne ta tranche d'âge.")
      if (!city.trim()) return Alert.alert('Champ requis', 'Indique ta ville.')
      if (!country.trim()) return Alert.alert('Champ requis', 'Indique ton pays.')
    }

    if (section === 'important') {
      if (!allergies) return Alert.alert('Champ requis', 'Indique si tu as des allergies.')
    }

    // build payload
    const baseQ = (profile?.questionnaire ?? {}) as any
    let payload: any = {}

    if (section === 'general') {
      payload = {
        nickname: nickname.trim(),
        gender,
        ageRange,
        city: city.trim(),
        country: country.trim(),
      }
    }

    if (section === 'hair') {
      payload = {
        questionnaire: {
          ...baseQ,
          hair: {
            ...(baseQ?.hair ?? {}),
            hairTypes,
            hairTexture,
            hairLength,
            hairConcerns,
          },
        },
      }
    }

    if (section === 'nails') {
      payload = {
        questionnaire: {
          ...baseQ,
          nails: {
            ...(baseQ?.nails ?? {}),
            nailTypes,
            nailStates,
            nailConcerns,
          },
        },
      }
    }

    if (section === 'faceSkin') {
      payload = {
        questionnaire: {
          ...baseQ,
          face: {
            ...(baseQ?.face ?? {}),
            faceSkin,
            faceConcerns,
          },
        },
      }
    }

    if (section === 'wellness') {
      payload = {
        questionnaire: {
          ...baseQ,
          body: {
            ...(baseQ?.body ?? {}),
            bodySkin,
            tensionZones,
            wellbeingConcerns,
            massageSensitiveZones,
          },
        },
      }
    }

    if (section === 'fitness') {
      payload = {
        questionnaire: {
          ...baseQ,
          fitness: {
            ...(baseQ?.fitness ?? {}),
            activityLevel,
            fitnessGoals,
            fitnessConcerns,
          },
        },
      }
    }

    if (section === 'practical') {
      payload = {
        questionnaire: {
          ...baseQ,
          practical: {
            ...(baseQ?.practical ?? {}),
            paymentPrefs,
            notifPrefs,
          },
        },
      }
    }

    if (section === 'important') {
      payload = {
        allergies,
        comments: comments?.trim() ? comments.trim() : null,
      }
    }

    try {
      setSaving(true)
      await patchMeProfile(token, payload)

      // ✅ refresh UI
      await qc.invalidateQueries({ queryKey: ['me', 'summary'] })
      await refetch()

      Alert.alert('OK', 'Modifications enregistrées.')
      router.back()
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
        </Pressable>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <Text style={styles.headerSubtitle}>Modifiez vos informations</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* ---- GENERAL ---- */}
          {section === 'general' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text="Surnom*" />
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="Votre prénom ou surnom"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <FieldLabel text="Email" hint="(non modifiable pour la bêta)" />
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{userInfo.email ?? 'Non renseigné'}</Text>
              </View>

              <FieldLabel text="Téléphone" hint="(non modifiable pour la bêta)" />
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{userInfo.phone ?? 'Non renseigné'}</Text>
              </View>

              <FieldLabel text="Genre*" />
              <SelectList
                options={GENDER_OPTIONS}
                value={gender}
                onChange={setGender}
              />

              <FieldLabel text="Tranche d'âge*" />
              <SelectList
                options={AGE_OPTIONS}
                value={ageRange}
                onChange={setAgeRange}
              />

              <FieldLabel text="Ville*" />
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Libreville"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <FieldLabel text="Pays*" />
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Ex: Gabon"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
          )}

          {/* ---- HAIR ---- */}
          {section === 'hair' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text={`Type de cheveux (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={HAIR_TYPES}
                selected={hairTypes}
                max={MAX_MULTI}
                onToggle={(v) => setHairTypes((prev) => clampSelect(prev, v, MAX_MULTI))}
              />

              <FieldLabel text="Texture" />
              <SelectList options={HAIR_TEXTURE_OPTIONS} value={hairTexture} onChange={setHairTexture} />

              <FieldLabel text="Longueur" />
              <SelectList options={HAIR_LENGTH_OPTIONS} value={hairLength} onChange={setHairLength} />

              <FieldLabel text={`Préoccupations (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={HAIR_CONCERNS}
                selected={hairConcerns}
                max={MAX_MULTI}
                onToggle={(v) => setHairConcerns((prev) => clampSelect(prev, v, MAX_MULTI))}
              />
            </View>
          )}

          {/* ---- NAILS ---- */}
          {section === 'nails' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text={`Type ongles (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={NAIL_TYPE_MAX2}
                selected={nailTypes}
                max={MAX_MULTI}
                onToggle={(v) => setNailTypes((prev) => clampSelect(prev, v, MAX_MULTI))}
              />

              <FieldLabel text={`État des ongles (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={NAIL_STATE_MAX2}
                selected={nailStates}
                max={MAX_MULTI}
                onToggle={(v) => setNailStates((prev) => clampSelect(prev, v, MAX_MULTI))}
              />

              <FieldLabel text={`Préoccupations (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={NAIL_CONCERNS_MAX3}
                selected={nailConcerns}
                max={MAX_MULTI}
                onToggle={(v) => setNailConcerns((prev) => clampSelect(prev, v, MAX_MULTI))}
              />
            </View>
          )}

          {/* ---- FACE ---- */}
          {section === 'faceSkin' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text="Type de peau (visage)" />
              <SelectList options={FACE_SKIN_OPTIONS} value={faceSkin} onChange={setFaceSkin} />

              <FieldLabel text={`Préoccupations visage (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={FACE_CONCERNS_MAX3}
                selected={faceConcerns}
                max={MAX_MULTI}
                onToggle={(v) => setFaceConcerns((prev) => clampSelect(prev, v, MAX_MULTI))}
              />
            </View>
          )}

          {/* ---- WELLNESS ---- */}
          {section === 'wellness' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text="Type de peau (corps)" />
              <SelectList options={BODY_SKIN_OPTIONS} value={bodySkin} onChange={setBodySkin} />

              <FieldLabel text={`Zones de tension / douleur (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={TENSION_ZONES_MAX3}
                selected={tensionZones}
                max={MAX_MULTI}
                onToggle={(v) => setTensionZones((prev) => clampSelect(prev, v, MAX_MULTI))}
              />

              <FieldLabel text={`Préoccupations bien-être (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={WELLBEING_CONCERNS_MAX3}
                selected={wellbeingConcerns}
                max={MAX_MULTI}
                onToggle={(v) => setWellbeingConcerns((prev) => clampSelect(prev, v, MAX_MULTI))}
              />

              <FieldLabel text={`Zones sensibles massage (max ${MAX_MULTI})`} hint="optionnel" />
              <ChipGroup
                chips={MASSAGE_SENSITIVE_ZONES_OPTIONAL}
                selected={massageSensitiveZones}
                max={MAX_MULTI}
                onToggle={(v) => setMassageSensitiveZones((prev) => clampSelect(prev, v, MAX_MULTI))}
              />
            </View>
          )}

          {/* ---- FITNESS ---- */}
          {section === 'fitness' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text="Niveau d'activité" />
              <SelectList options={ACTIVITY_LEVEL_OPTIONS} value={activityLevel} onChange={setActivityLevel} />

              <FieldLabel text={`Objectifs fitness (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={FITNESS_GOALS_MAX2}
                selected={fitnessGoals}
                max={MAX_MULTI}
                onToggle={(v) => setFitnessGoals((prev) => clampSelect(prev, v, MAX_MULTI))}
              />

              <FieldLabel text={`Préoccupations fitness / santé (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={FITNESS_CONCERNS_MAX3}
                selected={fitnessConcerns}
                max={MAX_MULTI}
                onToggle={(v) => setFitnessConcerns((prev) => clampSelect(prev, v, MAX_MULTI))}
              />
            </View>
          )}

          {/* ---- PRACTICAL ---- */}
          {section === 'practical' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text={`Modes de paiement préférés (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={PAYMENT_MAX2}
                selected={paymentPrefs}
                max={MAX_MULTI}
                onToggle={(v) => setPaymentPrefs((prev) => clampSelect(prev, v, MAX_MULTI))}
              />

              <FieldLabel text={`Notifications (max ${MAX_MULTI})`} />
              <ChipGroup
                chips={NOTIF_MAX2}
                selected={notifPrefs}
                max={MAX_MULTI}
                onToggle={(v) => setNotifPrefs((prev) => clampSelect(prev, v, MAX_MULTI))}
              />
            </View>
          )}

          {/* ---- IMPORTANT ---- */}
          {section === 'important' && (
            <View style={{ gap: spacing.lg }}>
              <FieldLabel text="Allergies / sensibilités*" />
              <SelectList options={ALLERGIES_OPTIONS} value={allergies} onChange={setAllergies} />

              <FieldLabel text="Commentaires ou besoins spécifiques" hint="optionnel" />
              <View style={styles.textAreaWrap}>
                <TextInput
                  value={comments}
                  onChangeText={setComments}
                  placeholder="Informations supplémentaires…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={styles.textArea}
                />
              </View>
            </View>
          )}

          <View style={{ height: 18 }} />

          <Button
            title={saving ? 'Enregistrement…' : 'Enregistrer'}
            onPress={onSave}
            disabled={!canSave}
          />

          <View style={{ height: 28 }} />
        </ScrollView>
      )}
    </Screen>
  )
}

// ---------- UI components ----------
function FieldLabel({
  text,
  hint,
}: {
  text: string
  hint?: string
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Text style={styles.label}>{text}</Text>
        {!!hint && <Text style={styles.labelHint}>{hint}</Text>}
      </View>
    </View>
  )
}

function SelectList({
  options,
  value,
  onChange,
}: {
  options: Option[]
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((o) => {
        const selected = value === o.value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.selectRow, selected && styles.selectRowSelected]}
          >
            <Text style={styles.selectRowText}>{o.label}</Text>
            {selected && <Ionicons name="checkmark" size={18} color={colors.brand} />}
          </Pressable>
        )
      })}
    </View>
  )
}

function ChipGroup({
  chips,
  selected,
  max,
  onToggle,
}: {
  chips: Chip[]
  selected: string[]
  max: number
  onToggle: (value: string) => void
}) {
  return (
    <View style={styles.chipWrap}>
      {chips.map((c) => {
        const isOn = selected.includes(c.value)
        const disabled = !isOn && selected.length >= max
        return (
          <Pressable
            key={c.value}
            onPress={() => onToggle(c.value)}
            disabled={disabled}
            style={[
              styles.chip,
              isOn && styles.chipOn,
              disabled && styles.chipDisabled,
            ]}
          >
            <Text style={[styles.chipText, isOn && styles.chipTextOn]}>
              {c.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerBack: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlays.white06,
    marginBottom: spacing.sm,
  },
  headerTitle: { color: colors.brandForeground, ...typography.h1, fontWeight: '800' },
  headerSubtitle: { marginTop: 6, color: 'rgba(255,255,255,0.85)', ...typography.small },

  loadingWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: { color: colors.textMuted, ...typography.body, fontWeight: '600' },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 80,
  },

  label: { color: colors.text, ...typography.small, fontWeight: '800' },
  labelHint: { color: colors.textMuted, ...typography.small, fontWeight: '600' },

  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.text,
    ...typography.body,
    fontWeight: '600',
  },

  readOnlyBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    opacity: 0.9,
  },
  readOnlyText: { color: colors.textMuted, ...typography.body, fontWeight: '700' },

  selectRow: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectRowSelected: {
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
  },
  selectRowText: {
    color: colors.text,
    ...typography.body,
    fontWeight: '700',
    flex: 1,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: { color: colors.text, ...typography.small, fontWeight: '700' },
  chipTextOn: { color: colors.brand },

  textAreaWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
    padding: spacing.md,
    minHeight: 140,
  },
  textArea: {
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
    ...typography.body,
    fontWeight: '600',
  },
})
