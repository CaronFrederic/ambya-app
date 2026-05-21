import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native'
import { router } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Input } from '../../src/components/Input'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'
import {
  buildGabonPhoneHint,
  DEFAULT_COUNTRY_NAME,
  formatGabonPhone,
  getDefaultCountry,
  getGabonNationalPhoneDigits,
  isValidGabonPhone,
} from '../../src/constants/countries'
import { registerClient, patchMeProfile, persistAuth } from '../../src/api/auth'
import { useAuthRefresh } from '../../src/providers/AuthRefreshProvider'

type StepKey =
  | 'general'
  | 'hair'
  | 'nails'
  | 'face'
  | 'body'
  | 'fitness'
  | 'practical'
  | 'important'
  | 'confirmation'

type Option = { label: string; value: string }
type Chip = { label: string; value: string }

const TOTAL_STEPS = 9

const STEP_META: { key: StepKey; sectionTitle: string; title: string }[] = [
  { key: 'general', sectionTitle: 'Section 1/9', title: 'Informations générales' },
  { key: 'hair', sectionTitle: 'Section 2/9', title: 'Profil capillaire' },
  { key: 'nails', sectionTitle: 'Section 3/9', title: 'Ongles' },
  { key: 'face', sectionTitle: 'Section 4/9', title: 'Peau du visage' },
  { key: 'body', sectionTitle: 'Section 5/9', title: 'Bien-être & corps' },
  { key: 'fitness', sectionTitle: 'Section 6/9', title: 'Fitness' },
  { key: 'practical', sectionTitle: 'Section 7/9', title: 'Préférences pratiques' },
  { key: 'important', sectionTitle: 'Section 8/9', title: 'Informations importantes' },
  { key: 'confirmation', sectionTitle: 'Section 9/9', title: 'Confirmation' },
]

const GENDER_OPTIONS: Option[] = [
  { label: 'Femme', value: 'female' },
  { label: 'Homme', value: 'male' },
  { label: 'Autre', value: 'other' },
  { label: 'Préfère ne pas dire', value: 'na' },
]

const AGE_OPTIONS: Option[] = [
  { label: '18-24 ans', value: '18-24' },
  { label: '25-34 ans', value: '25-34' },
  { label: '35-44 ans', value: '35-44' },
  { label: '45-54 ans', value: '45-54' },
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
  { label: 'Durs', value: 'hard' },
  { label: 'Fragiles', value: 'fragile' },
  { label: 'Je ne sais pas', value: 'na' },
]

const NAIL_STATE_MAX2: Chip[] = [
  { label: 'Cassants', value: 'brittle' },
  { label: 'Mous', value: 'soft' },
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
  { label: 'Espèces', value: 'cash' },
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

function clampSelect(list: string[], value: string, max: number) {
  const exists = list.includes(value)
  if (exists) return list.filter((entry) => entry !== value)
  if (list.length >= max) return list
  return [...list, value]
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function ClientSignup() {
  const defaultCountry = getDefaultCountry()
  const [stepIndex, setStepIndex] = useState(0)
  const [attempted, setAttempted] = useState(false)

  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [country] = useState(defaultCountry.name ?? DEFAULT_COUNTRY_NAME)

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [hairTypes, setHairTypes] = useState<string[]>([])
  const [hairTexture, setHairTexture] = useState<string | null>(null)
  const [hairLength, setHairLength] = useState<string | null>(null)
  const [hairConcerns, setHairConcerns] = useState<string[]>([])

  const [nailTypes, setNailTypes] = useState<string[]>([])
  const [nailStates, setNailStates] = useState<string[]>([])
  const [nailConcerns, setNailConcerns] = useState<string[]>([])

  const [faceSkin, setFaceSkin] = useState<string | null>(null)
  const [faceConcerns, setFaceConcerns] = useState<string[]>([])

  const [bodySkin, setBodySkin] = useState<string | null>(null)
  const [tensionZones, setTensionZones] = useState<string[]>([])
  const [wellbeingConcerns, setWellbeingConcerns] = useState<string[]>([])
  const [massageSensitiveZones, setMassageSensitiveZones] = useState<string[]>([])

  const [activityLevel, setActivityLevel] = useState<string | null>(null)
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([])
  const [fitnessConcerns, setFitnessConcerns] = useState<string[]>([])

  const [paymentPrefs, setPaymentPrefs] = useState<string[]>([])
  const [notifPrefs, setNotifPrefs] = useState<string[]>([])

  const [allergies, setAllergies] = useState<string | null>(null)
  const [comments, setComments] = useState('')

  const meta = STEP_META[stepIndex]
  const { refreshAuth } = useAuthRefresh()
  const [submitting, setSubmitting] = useState(false)

  const hasEmail = email.trim().length > 0
  const hasPhone = phone.trim().length > 0
  const phoneDigits = getGabonNationalPhoneDigits(phone)

  const progress = useMemo(() => {
    const section = stepIndex + 1
    const pct = Math.round((section / TOTAL_STEPS) * 100)
    return { section, pct }
  }, [stepIndex])

  const generalErrors = attempted
    ? {
        nickname: !nickname.trim() ? 'Indique ton prénom ou surnom.' : undefined,
        gender: !gender ? 'Sélectionne ton genre.' : undefined,
        ageRange: !ageRange ? "Sélectionne ta tranche d'âge." : undefined,
        city: !city.trim() ? 'Indique ta ville.' : undefined,
      }
    : {}

  const contactError =
    attempted && !hasEmail && !hasPhone
      ? 'Renseigne au minimum un email ou un numéro de téléphone.'
      : undefined

  const emailError =
    attempted && hasEmail && !isEmail(email)
      ? "Vérifie le format de ton email."
      : undefined

  const phoneError =
    attempted && hasPhone && !isValidGabonPhone(phone)
      ? buildGabonPhoneHint()
      : undefined

  const passwordError =
    attempted && password.length < 6
      ? 'Choisis un mot de passe de 6 caractères minimum.'
      : undefined

  const confirmPasswordError =
    attempted && !confirmPassword
      ? 'Confirme ton mot de passe.'
      : attempted && confirmPassword !== password
        ? 'Les mots de passe ne correspondent pas.'
      : undefined

  const canGoBack = stepIndex > 0

  const validateStep = () => {
    if (meta.key === 'general') {
      if (!nickname.trim() || !gender || !ageRange || !city.trim()) return false
      if (!hasEmail && !hasPhone) return false
      if (hasEmail && !isEmail(email)) return false
      if (hasPhone && !isValidGabonPhone(phone)) return false
      if (!password || password.length < 6) return false
      if (!confirmPassword || password !== confirmPassword) return false
      return true
    }

    if (meta.key === 'important' && !allergies) {
      return false
    }

    return true
  }

  const onNext = () => {
    setAttempted(true)
    if (!validateStep()) return
    setAttempted(false)
    if (stepIndex < TOTAL_STEPS - 1) setStepIndex(stepIndex + 1)
  }

  const onBack = () => {
    setAttempted(false)
    setStepIndex(Math.max(0, stepIndex - 1))
  }

  const onFinish = async () => {
    try {
      setSubmitting(true)

      const reg = await registerClient({
        email: email.trim() || undefined,
        phone: phoneDigits || undefined,
        password,
      })

      await persistAuth(reg.accessToken, reg.user.role)

      const payload = {
        nickname: nickname.trim(),
        gender,
        ageRange,
        city: city.trim(),
        country,
        allergies,
        comments: comments.trim() || null,
        questionnaire: {
          hair: {
            hairTypes,
            hairTexture,
            hairLength,
            hairConcerns,
          },
          nails: {
            nailTypes,
            nailStates,
            nailConcerns,
          },
          face: {
            faceSkin,
            faceConcerns,
          },
          body: {
            bodySkin,
            tensionZones,
            wellbeingConcerns,
            massageSensitiveZones,
          },
          fitness: {
            activityLevel,
            fitnessGoals,
            fitnessConcerns,
          },
          practical: {
            paymentPrefs,
            notifPrefs,
          },
        },
      }

      await patchMeProfile(reg.accessToken, payload)
      await refreshAuth()
      router.replace('/(tabs)/home')
    } catch (error: any) {
      Alert.alert('Erreur', error?.message ?? "Impossible de créer le compte.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen style={styles.screen} keyboard>
      <View style={styles.header}>
        <Text style={styles.section}>{meta.sectionTitle}</Text>
        <Text style={styles.headerTitle}>{meta.title}</Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.pct}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.pct}% complété</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {meta.key === 'general' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel text="Comment souhaitez-vous qu'on vous appelle ?*" error={generalErrors.nickname} />
            <Input placeholder="Votre prénom ou surnom" value={nickname} onChangeText={setNickname} />

            <FieldLabel text="Genre*" error={generalErrors.gender} />
            <View style={{ gap: spacing.sm }}>
              {GENDER_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={gender === option.value}
                  onPress={() => setGender(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Tranche d'âge*" error={generalErrors.ageRange} />
            <View style={{ gap: spacing.sm }}>
              {AGE_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={ageRange === option.value}
                  onPress={() => setAgeRange(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Ville*" error={generalErrors.city} />
            <Input placeholder="Ex. Libreville" value={city} onChangeText={setCity} />

            <FieldLabel text="Pays*" hint="Cible actuelle : Gabon" />
            <Input value={country} editable={false} />

            <View style={styles.divider} />

            <Input
              label="Email"
              hint={!contactError ? 'Optionnel si un numéro de téléphone est renseigné.' : undefined}
              error={contactError || emailError}
              placeholder="nom@ambya.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Téléphone"
              hint={!contactError && !phoneError ? buildGabonPhoneHint() : undefined}
              error={contactError || phoneError}
              placeholder="XXX XX XX XX"
              value={phone}
              onChangeText={(value) => setPhone(formatGabonPhone(value))}
              keyboardType="phone-pad"
            />

            <Input
              label="Mot de passe*"
              error={passwordError}
              hint={!passwordError ? '6 caractères minimum.' : undefined}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              variant="password"
              autoCapitalize="none"
            />

            <Input
              label="Confirmer le mot de passe*"
              error={confirmPasswordError}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              variant="password"
              autoCapitalize="none"
            />
          </View>
        )}

        {meta.key === 'hair' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel text="Type de cheveux (max 2)*" />
            <ChipGroup
              chips={HAIR_TYPES}
              selected={hairTypes}
              max={2}
              onToggle={(value) => setHairTypes((prev) => clampSelect(prev, value, 2))}
            />

            <FieldLabel text="Texture de vos cheveux*" />
            <View style={{ gap: spacing.sm }}>
              {HAIR_TEXTURE_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={hairTexture === option.value}
                  onPress={() => setHairTexture(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Longueur actuelle*" />
            <View style={{ gap: spacing.sm }}>
              {HAIR_LENGTH_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={hairLength === option.value}
                  onPress={() => setHairLength(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Préoccupations capillaires (max 3)" />
            <ChipGroup
              chips={HAIR_CONCERNS}
              selected={hairConcerns}
              max={3}
              onToggle={(value) => setHairConcerns((prev) => clampSelect(prev, value, 3))}
            />
          </View>
        )}

        {meta.key === 'nails' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel text="Type d'ongles (max 2)*" />
            <ChipGroup
              chips={NAIL_TYPE_MAX2}
              selected={nailTypes}
              max={2}
              onToggle={(value) => setNailTypes((prev) => clampSelect(prev, value, 2))}
            />

            <FieldLabel text="État des ongles (max 2)" />
            <ChipGroup
              chips={NAIL_STATE_MAX2}
              selected={nailStates}
              max={2}
              onToggle={(value) => setNailStates((prev) => clampSelect(prev, value, 2))}
            />

            <FieldLabel text="Préoccupations (max 3)" />
            <ChipGroup
              chips={NAIL_CONCERNS_MAX3}
              selected={nailConcerns}
              max={3}
              onToggle={(value) => setNailConcerns((prev) => clampSelect(prev, value, 3))}
            />
          </View>
        )}

        {meta.key === 'face' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel text="Quel est votre type de peau ?*" />
            <View style={{ gap: spacing.sm }}>
              {FACE_SKIN_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={faceSkin === option.value}
                  onPress={() => setFaceSkin(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Préoccupations visage (max 3)" />
            <ChipGroup
              chips={FACE_CONCERNS_MAX3}
              selected={faceConcerns}
              max={3}
              onToggle={(value) => setFaceConcerns((prev) => clampSelect(prev, value, 3))}
            />
          </View>
        )}

        {meta.key === 'body' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel text="Type de peau (corps)*" />
            <View style={{ gap: spacing.sm }}>
              {BODY_SKIN_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={bodySkin === option.value}
                  onPress={() => setBodySkin(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Zones de tension ou douleur (max 3)" />
            <ChipGroup
              chips={TENSION_ZONES_MAX3}
              selected={tensionZones}
              max={3}
              onToggle={(value) => setTensionZones((prev) => clampSelect(prev, value, 3))}
            />

            <FieldLabel text="Préoccupations bien-être (max 3)" />
            <ChipGroup
              chips={WELLBEING_CONCERNS_MAX3}
              selected={wellbeingConcerns}
              max={3}
              onToggle={(value) => setWellbeingConcerns((prev) => clampSelect(prev, value, 3))}
            />

            <FieldLabel text="Zones sensibles au massage (optionnel)" />
            <ChipGroup
              chips={MASSAGE_SENSITIVE_ZONES_OPTIONAL}
              selected={massageSensitiveZones}
              max={99}
              onToggle={(value) =>
                setMassageSensitiveZones((prev) =>
                  prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value],
                )
              }
            />
          </View>
        )}

        {meta.key === 'fitness' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel text="Votre niveau d'activité physique*" />
            <View style={{ gap: spacing.sm }}>
              {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={activityLevel === option.value}
                  onPress={() => setActivityLevel(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Objectifs fitness (max 2)" />
            <ChipGroup
              chips={FITNESS_GOALS_MAX2}
              selected={fitnessGoals}
              max={2}
              onToggle={(value) => setFitnessGoals((prev) => clampSelect(prev, value, 2))}
            />

            <FieldLabel text="Préoccupations fitness / santé (max 3)" />
            <ChipGroup
              chips={FITNESS_CONCERNS_MAX3}
              selected={fitnessConcerns}
              max={3}
              onToggle={(value) => setFitnessConcerns((prev) => clampSelect(prev, value, 3))}
            />
          </View>
        )}

        {meta.key === 'practical' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel text="Modes de paiement préférés (max 2)" />
            <ChipGroup
              chips={PAYMENT_MAX2}
              selected={paymentPrefs}
              max={2}
              onToggle={(value) => setPaymentPrefs((prev) => clampSelect(prev, value, 2))}
            />

            <FieldLabel text="Notifications (max 2)" />
            <ChipGroup
              chips={NOTIF_MAX2}
              selected={notifPrefs}
              max={2}
              onToggle={(value) => setNotifPrefs((prev) => clampSelect(prev, value, 2))}
            />
          </View>
        )}

        {meta.key === 'important' && (
          <View style={{ gap: spacing.lg }}>
            <FieldLabel
              text="Avez-vous des allergies ou sensibilités ?*"
              error={attempted && !allergies ? 'Indique si tu as des allergies.' : undefined}
            />
            <View style={{ gap: spacing.sm }}>
              {ALLERGIES_OPTIONS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  selected={allergies === option.value}
                  onPress={() => setAllergies(option.value)}
                />
              ))}
            </View>

            <FieldLabel text="Commentaires ou besoins spécifiques (optionnel)" />
            <View style={styles.textAreaWrap}>
              <TextInput
                value={comments}
                onChangeText={setComments}
                placeholder="Informations supplémentaires que vous souhaitez partager..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={styles.textArea}
              />
            </View>
          </View>
        )}

        {meta.key === 'confirmation' && (
          <View style={styles.confirmWrap}>
            <View style={styles.checkCircleOuter}>
              <View style={styles.checkCircleInner}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            </View>

            <Text style={styles.confirmTitle}>Votre profil a bien été complété !</Text>
            <Text style={styles.confirmText}>
              Vos préférences nous aideront à personnaliser{'\n'}votre expérience AMBYA.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {canGoBack && (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </Pressable>
        )}

        {meta.key !== 'confirmation' ? (
          <Pressable onPress={onNext} style={[styles.nextBtn, !canGoBack && { marginLeft: 0 }]}>
            <Text style={styles.nextBtnText}>Suivant ›</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onFinish} style={styles.finishBtn} disabled={submitting}>
            <Text style={styles.finishBtnText}>{submitting ? 'Création…' : 'Terminer ✓'}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  )
}

function FieldLabel({
  text,
  hint,
  error,
}: {
  text: string
  hint?: string
  error?: string
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Text style={styles.label}>{text}</Text>
        {!!hint && <Text style={styles.labelHint}>{hint}</Text>}
      </View>
      {!!error && <Text style={styles.labelError}>{error}</Text>}
    </View>
  )
}

function SelectRow({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.selectRow, selected && styles.selectRowSelected]}>
      <Text style={[styles.selectRowText, selected && styles.selectRowTextSelected]}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
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
      {chips.map((chip) => {
        const isOn = selected.includes(chip.value)
        const disabled = !isOn && selected.length >= max
        return (
          <Pressable
            key={chip.value}
            onPress={() => onToggle(chip.value)}
            disabled={disabled}
            style={[styles.chip, isOn && styles.chipOn, disabled && styles.chipDisabled]}
          >
            <Text style={[styles.chipText, isOn && styles.chipTextOn]}>
              {isOn ? '✓ ' : ''}
              {chip.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  section: {
    color: colors.premium,
    textAlign: 'center',
    ...typography.small,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    color: colors.brandForeground,
    textAlign: 'center',
    ...typography.h3,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  progressWrap: {
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: overlays.white10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.premium,
    borderRadius: 999,
  },
  progressText: {
    color: colors.premium,
    textAlign: 'center',
    ...typography.small,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 180,
  },
  label: {
    color: colors.text,
    ...typography.small,
    fontWeight: '600',
  },
  labelHint: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelError: {
    color: colors.dangerText,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  selectRow: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectRowSelected: {
    borderColor: colors.brand,
    backgroundColor: overlays.brand10,
  },
  selectRowText: {
    color: colors.text,
    fontWeight: '500',
  },
  selectRowTextSelected: {
    color: colors.brand,
    fontWeight: '800',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    color: colors.text,
    ...typography.small,
    fontWeight: '500',
  },
  chipTextOn: {
    color: colors.brandForeground,
    fontWeight: '800',
  },
  textAreaWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 120,
  },
  textArea: {
    color: colors.text,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.brand,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1.4,
    backgroundColor: colors.brand,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: colors.brandForeground,
    fontWeight: '700',
  },
  finishBtn: {
    flex: 1.4,
    backgroundColor: colors.premium,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    color: colors.brand,
    fontWeight: '700',
  },
  confirmWrap: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  checkCircleOuter: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleInner: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#E9FFF0',
    borderWidth: 2,
    borderColor: colors.successText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.successText,
    ...typography.h3,
    fontWeight: '900',
  },
  confirmTitle: {
    color: colors.text,
    ...typography.h3,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmText: {
    color: colors.textMuted,
    textAlign: 'center',
    ...typography.small,
    lineHeight: 18,
  },
})
