import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { useAdminUser, useUpdateAdminUser } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle, AdminStatCard } from '../../src/components/AdminScaffold'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import {
  type LabelMap,
  MAP_ACTIVITY,
  MAP_AGE,
  MAP_ALLERGIES,
  MAP_BODY_SKIN,
  MAP_FACE_CONCERNS,
  MAP_FACE_SKIN,
  MAP_FITNESS_CONCERNS,
  MAP_FITNESS_GOALS,
  MAP_GENDER,
  MAP_HAIR_CONCERNS,
  MAP_HAIR_LENGTH,
  MAP_HAIR_TEXTURE,
  MAP_HAIR_TYPES,
  MAP_NAIL_CONCERNS,
  MAP_NAIL_STATE,
  MAP_NAIL_TYPE,
  MAP_NOTIF_PREFS,
  MAP_PAYMENT_PREFS,
  MAP_WELLBEING,
  MAP_ZONES,
} from '../../src/constants/questionnaireLabels'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

type Option = { label: string; value: string }
type Chip = { label: string; value: string }

const MAX_MULTI = 3

function mapToOptions(map: LabelMap): Option[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }))
}

function mapToChips(map: LabelMap, opts?: { exclude?: string[] }): Chip[] {
  const exclude = new Set(opts?.exclude ?? [])
  return Object.entries(map)
    .filter(([value]) => !exclude.has(value))
    .map(([value, label]) => ({ value, label }))
}

function clampSelect(list: string[], value: string, max: number) {
  const exists = list.includes(value)
  if (exists) return list.filter((item) => item !== value)
  if (list.length >= max) return list
  return [...list, value]
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleChip, active && styles.toggleChipActive]}>
      <Text style={[styles.toggleChipText, active && styles.toggleChipTextActive]}>{label}</Text>
    </Pressable>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value && String(value).trim() ? value : 'Non renseigne'}</Text>
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
  onChange: (value: string) => void
}) {
  return (
    <View style={styles.selectList}>
      {options.map((option) => {
        const selected = value === option.value
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.selectRow, selected && styles.selectRowSelected]}
          >
            <Text style={styles.selectRowText}>{option.label}</Text>
            {selected ? <Text style={styles.selectCheck}>OK</Text> : null}
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
    <View style={styles.chipGrid}>
      {chips.map((chip) => {
        const active = selected.includes(chip.value)
        const disabled = !active && selected.length >= max
        return (
          <Pressable
            key={chip.value}
            onPress={() => onToggle(chip.value)}
            disabled={disabled}
            style={[
              styles.choiceChip,
              active && styles.choiceChipActive,
              disabled && styles.choiceChipDisabled,
            ]}
          >
            <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
              {chip.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function AdminClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useAdminUser(id)
  const updateUser = useUpdateAdminUser()
  const item = data?.item as any

  const questionnaire = useMemo(
    () =>
      item?.clientProfile?.questionnaire && typeof item.clientProfile.questionnaire === 'object'
        ? item.clientProfile.questionnaire
        : {},
    [item?.clientProfile?.questionnaire],
  )

  const GENDER_OPTIONS = useMemo(() => mapToOptions(MAP_GENDER), [])
  const AGE_OPTIONS = useMemo(() => mapToOptions(MAP_AGE), [])
  const ALLERGY_OPTIONS = useMemo(() => mapToOptions(MAP_ALLERGIES), [])
  const HAIR_TYPE_CHIPS = useMemo(() => mapToChips(MAP_HAIR_TYPES), [])
  const HAIR_TEXTURE_OPTIONS = useMemo(() => mapToOptions(MAP_HAIR_TEXTURE), [])
  const HAIR_LENGTH_OPTIONS = useMemo(() => mapToOptions(MAP_HAIR_LENGTH), [])
  const HAIR_CONCERN_CHIPS = useMemo(() => mapToChips(MAP_HAIR_CONCERNS), [])
  const NAIL_TYPE_CHIPS = useMemo(() => mapToChips(MAP_NAIL_TYPE), [])
  const NAIL_STATE_CHIPS = useMemo(() => mapToChips(MAP_NAIL_STATE), [])
  const NAIL_CONCERN_CHIPS = useMemo(() => mapToChips(MAP_NAIL_CONCERNS), [])
  const FACE_SKIN_OPTIONS = useMemo(() => mapToOptions(MAP_FACE_SKIN), [])
  const FACE_CONCERN_CHIPS = useMemo(() => mapToChips(MAP_FACE_CONCERNS), [])
  const BODY_SKIN_OPTIONS = useMemo(() => mapToOptions(MAP_BODY_SKIN), [])
  const TENSION_ZONE_CHIPS = useMemo(() => mapToChips(MAP_ZONES), [])
  const MASSAGE_ZONE_CHIPS = useMemo(() => mapToChips(MAP_ZONES, { exclude: ['na'] }), [])
  const WELLBEING_CHIPS = useMemo(() => mapToChips(MAP_WELLBEING), [])
  const ACTIVITY_OPTIONS = useMemo(() => mapToOptions(MAP_ACTIVITY), [])
  const FITNESS_GOAL_CHIPS = useMemo(() => mapToChips(MAP_FITNESS_GOALS), [])
  const FITNESS_CONCERN_CHIPS = useMemo(() => mapToChips(MAP_FITNESS_CONCERNS), [])
  const PAYMENT_PREF_CHIPS = useMemo(() => mapToChips(MAP_PAYMENT_PREFS), [])
  const NOTIF_PREF_CHIPS = useMemo(() => mapToChips(MAP_NOTIF_PREFS), [])

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [accountActive, setAccountActive] = useState(true)
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [allergies, setAllergies] = useState<string | null>(null)
  const [comments, setComments] = useState('')
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

  useEffect(() => {
    if (!item) return
    setEmail(item.email ?? '')
    setPhone(item.phone ?? '')
    setAccountActive(Boolean(item.isActive))
    setNickname(item.clientProfile?.nickname ?? '')
    setGender(item.clientProfile?.gender ?? null)
    setAgeRange(item.clientProfile?.ageRange ?? null)
    setCity(item.clientProfile?.city ?? '')
    setCountry(item.clientProfile?.country ?? '')
    setAllergies(item.clientProfile?.allergies ?? null)
    setComments(item.clientProfile?.comments ?? '')
    setHairTypes(Array.isArray(questionnaire?.hair?.hairTypes) ? questionnaire.hair.hairTypes : [])
    setHairTexture(questionnaire?.hair?.hairTexture ?? null)
    setHairLength(questionnaire?.hair?.hairLength ?? null)
    setHairConcerns(Array.isArray(questionnaire?.hair?.hairConcerns) ? questionnaire.hair.hairConcerns : [])
    setNailTypes(Array.isArray(questionnaire?.nails?.nailTypes) ? questionnaire.nails.nailTypes : [])
    setNailStates(Array.isArray(questionnaire?.nails?.nailStates) ? questionnaire.nails.nailStates : [])
    setNailConcerns(Array.isArray(questionnaire?.nails?.nailConcerns) ? questionnaire.nails.nailConcerns : [])
    setFaceSkin(questionnaire?.face?.faceSkin ?? null)
    setFaceConcerns(Array.isArray(questionnaire?.face?.faceConcerns) ? questionnaire.face.faceConcerns : [])
    setBodySkin(questionnaire?.body?.bodySkin ?? questionnaire?.body?.skinType ?? null)
    setTensionZones(
      Array.isArray(questionnaire?.body?.tensionZones)
        ? questionnaire.body.tensionZones
        : Array.isArray(questionnaire?.body?.focusAreas)
          ? questionnaire.body.focusAreas
          : [],
    )
    setWellbeingConcerns(
      Array.isArray(questionnaire?.body?.wellbeingConcerns)
        ? questionnaire.body.wellbeingConcerns
        : Array.isArray(questionnaire?.body?.concerns)
          ? questionnaire.body.concerns
          : [],
    )
    setMassageSensitiveZones(
      Array.isArray(questionnaire?.body?.massageSensitiveZones)
        ? questionnaire.body.massageSensitiveZones
        : Array.isArray(questionnaire?.body?.sensitiveZones)
          ? questionnaire.body.sensitiveZones
          : [],
    )
    setActivityLevel(questionnaire?.fitness?.activityLevel ?? null)
    setFitnessGoals(Array.isArray(questionnaire?.fitness?.fitnessGoals) ? questionnaire.fitness.fitnessGoals : [])
    setFitnessConcerns(
      Array.isArray(questionnaire?.fitness?.fitnessConcerns) ? questionnaire.fitness.fitnessConcerns : [],
    )
    setPaymentPrefs(
      Array.isArray(questionnaire?.practical?.paymentPrefs) ? questionnaire.practical.paymentPrefs : [],
    )
    setNotifPrefs(Array.isArray(questionnaire?.practical?.notifPrefs) ? questionnaire.practical.notifPrefs : [])
  }, [item, questionnaire])

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        id: id!,
        email,
        phone,
        isActive: accountActive,
        nickname,
        gender,
        ageRange,
        city,
        country,
        allergies,
        comments,
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
      })
      Alert.alert('Modifications enregistrees', 'La fiche client a ete mise a jour.')
      void refetch()
    } catch (error: any) {
      Alert.alert(
        'Mise a jour impossible',
        error?.response?.data?.message?.[0] ??
          error?.response?.data?.message ??
          'Impossible de mettre a jour cette fiche client.',
      )
    }
  }

  return (
    <Screen noPadding>
      <AdminHeader title="Fiche client" subtitle="Support, profil complet et edition metier" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FeedbackState title="Chargement de la fiche client" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError || !item ? (
          <FeedbackState
            title="Fiche client indisponible"
            description="Impossible de charger cette fiche pour le moment."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <AdminStatCard label="RDV" value={item.analytics?.totalAppointments ?? 0} />
              <AdminStatCard
                label="Depense"
                value={`${(item.analytics?.totalSpent ?? 0).toLocaleString('fr-FR')} FCFA`}
              />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Annulations" value={item.analytics?.cancelledAppointments ?? 0} />
              <AdminStatCard label="No-show" value={item.analytics?.noShows ?? 0} />
            </View>

            <AdminSectionTitle title="Compte & profil general" />
            <Card style={styles.card}>
              <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
              <Input value={phone} onChangeText={setPhone} placeholder="Telephone" />
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Statut du compte</Text>
                <View style={styles.toggleGroup}>
                  <ToggleChip label="Actif" active={accountActive} onPress={() => setAccountActive(true)} />
                  <ToggleChip label="Inactif" active={!accountActive} onPress={() => setAccountActive(false)} />
                </View>
              </View>
              <Input value={nickname} onChangeText={setNickname} placeholder="Surnom" />
              <Text style={styles.fieldLabel}>Genre</Text>
              <SelectList options={GENDER_OPTIONS} value={gender} onChange={setGender} />
              <Text style={styles.fieldLabel}>Tranche d'age</Text>
              <SelectList options={AGE_OPTIONS} value={ageRange} onChange={setAgeRange} />
              <Input value={city} onChangeText={setCity} placeholder="Ville" />
              <Input value={country} onChangeText={setCountry} placeholder="Pays" />
              <Text style={styles.fieldLabel}>Allergies / sensibilites</Text>
              <SelectList options={ALLERGY_OPTIONS} value={allergies} onChange={setAllergies} />
              <Input value={comments} onChangeText={setComments} placeholder="Commentaires support" multiline />
            </Card>

            <AdminSectionTitle title={`Profil cheveux (max ${MAX_MULTI} choix)`} />
            <Card style={styles.card}>
              <Text style={styles.fieldLabel}>Type de cheveux</Text>
              <ChipGroup
                chips={HAIR_TYPE_CHIPS}
                selected={hairTypes}
                max={MAX_MULTI}
                onToggle={(value) => setHairTypes((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Texture</Text>
              <SelectList options={HAIR_TEXTURE_OPTIONS} value={hairTexture} onChange={setHairTexture} />
              <Text style={styles.fieldLabel}>Longueur</Text>
              <SelectList options={HAIR_LENGTH_OPTIONS} value={hairLength} onChange={setHairLength} />
              <Text style={styles.fieldLabel}>Preoccupations cheveux</Text>
              <ChipGroup
                chips={HAIR_CONCERN_CHIPS}
                selected={hairConcerns}
                max={MAX_MULTI}
                onToggle={(value) => setHairConcerns((current) => clampSelect(current, value, MAX_MULTI))}
              />
            </Card>

            <AdminSectionTitle title={`Profil ongles (max ${MAX_MULTI} choix)`} />
            <Card style={styles.card}>
              <Text style={styles.fieldLabel}>Type d'ongles</Text>
              <ChipGroup
                chips={NAIL_TYPE_CHIPS}
                selected={nailTypes}
                max={MAX_MULTI}
                onToggle={(value) => setNailTypes((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Etat des ongles</Text>
              <ChipGroup
                chips={NAIL_STATE_CHIPS}
                selected={nailStates}
                max={MAX_MULTI}
                onToggle={(value) => setNailStates((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Preoccupations ongles</Text>
              <ChipGroup
                chips={NAIL_CONCERN_CHIPS}
                selected={nailConcerns}
                max={MAX_MULTI}
                onToggle={(value) => setNailConcerns((current) => clampSelect(current, value, MAX_MULTI))}
              />
            </Card>

            <AdminSectionTitle title={`Profil visage (max ${MAX_MULTI} choix)`} />
            <Card style={styles.card}>
              <Text style={styles.fieldLabel}>Type de peau visage</Text>
              <SelectList options={FACE_SKIN_OPTIONS} value={faceSkin} onChange={setFaceSkin} />
              <Text style={styles.fieldLabel}>Preoccupations visage</Text>
              <ChipGroup
                chips={FACE_CONCERN_CHIPS}
                selected={faceConcerns}
                max={MAX_MULTI}
                onToggle={(value) => setFaceConcerns((current) => clampSelect(current, value, MAX_MULTI))}
              />
            </Card>

            <AdminSectionTitle title={`Bien-etre (max ${MAX_MULTI} choix)`} />
            <Card style={styles.card}>
              <Text style={styles.fieldLabel}>Type de peau corps</Text>
              <SelectList options={BODY_SKIN_OPTIONS} value={bodySkin} onChange={setBodySkin} />
              <Text style={styles.fieldLabel}>Zones de tension</Text>
              <ChipGroup
                chips={TENSION_ZONE_CHIPS}
                selected={tensionZones}
                max={MAX_MULTI}
                onToggle={(value) => setTensionZones((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Preoccupations bien-etre</Text>
              <ChipGroup
                chips={WELLBEING_CHIPS}
                selected={wellbeingConcerns}
                max={MAX_MULTI}
                onToggle={(value) => setWellbeingConcerns((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Zones sensibles massage</Text>
              <ChipGroup
                chips={MASSAGE_ZONE_CHIPS}
                selected={massageSensitiveZones}
                max={MAX_MULTI}
                onToggle={(value) => setMassageSensitiveZones((current) => clampSelect(current, value, MAX_MULTI))}
              />
            </Card>

            <AdminSectionTitle title={`Fitness & habitudes (max ${MAX_MULTI} choix)`} />
            <Card style={styles.card}>
              <Text style={styles.fieldLabel}>Niveau d'activite</Text>
              <SelectList options={ACTIVITY_OPTIONS} value={activityLevel} onChange={setActivityLevel} />
              <Text style={styles.fieldLabel}>Objectifs fitness</Text>
              <ChipGroup
                chips={FITNESS_GOAL_CHIPS}
                selected={fitnessGoals}
                max={MAX_MULTI}
                onToggle={(value) => setFitnessGoals((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Preoccupations fitness</Text>
              <ChipGroup
                chips={FITNESS_CONCERN_CHIPS}
                selected={fitnessConcerns}
                max={MAX_MULTI}
                onToggle={(value) => setFitnessConcerns((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Preferences paiement</Text>
              <ChipGroup
                chips={PAYMENT_PREF_CHIPS}
                selected={paymentPrefs}
                max={MAX_MULTI}
                onToggle={(value) => setPaymentPrefs((current) => clampSelect(current, value, MAX_MULTI))}
              />
              <Text style={styles.fieldLabel}>Preferences notifications</Text>
              <ChipGroup
                chips={NOTIF_PREF_CHIPS}
                selected={notifPrefs}
                max={MAX_MULTI}
                onToggle={(value) => setNotifPrefs((current) => clampSelect(current, value, MAX_MULTI))}
              />
            </Card>

            <AdminSectionTitle title="Fidelite & paiements" />
            <Card style={styles.card}>
              <DetailRow label="Niveau fidelite" value={item.loyalty?.tier} />
              <DetailRow label="Points actuels" value={String(item.loyalty?.currentPoints ?? 0)} />
              <DetailRow label="Points cumules" value={String(item.loyalty?.lifetimePoints ?? 0)} />
              <DetailRow label="Reduction en attente" value={String(item.loyalty?.pendingDiscountAmount ?? 0)} />
              <DetailRow label="Moyens de paiement" value={String((item.paymentMethods ?? []).length)} />
            </Card>

            <AdminSectionTitle title="Moyens de paiement enregistres" />
            <View style={styles.list}>
              {(item.paymentMethods ?? []).length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucun moyen de paiement enregistre.</Text>
                </Card>
              ) : (
                (item.paymentMethods ?? []).map((paymentMethod: any) => (
                  <Card key={paymentMethod.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{paymentMethod.label ?? paymentMethod.type ?? 'Moyen de paiement'}</Text>
                    <Text style={styles.metaText}>{paymentMethod.provider ?? 'Provider non renseigne'}</Text>
                    <Text style={styles.metaText}>
                      {paymentMethod.last4 ? `**** ${paymentMethod.last4}` : paymentMethod.phone ?? 'Details indisponibles'}
                    </Text>
                    <Text style={styles.metaText}>
                      {paymentMethod.isDefault ? 'Moyen par defaut' : 'Moyen secondaire'}
                    </Text>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title="Transactions recentes" />
            <View style={styles.list}>
              {(item.transactions ?? []).length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucune transaction recente.</Text>
                </Card>
              ) : (
                (item.transactions ?? []).map((transaction: any) => (
                  <Card key={transaction.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{transaction.status ?? 'Transaction'}</Text>
                    <Text style={styles.metaText}>{transaction.provider ?? 'Provider non renseigne'}</Text>
                    <Text style={styles.metaText}>
                      {(transaction.amount ?? 0).toLocaleString('fr-FR')} {transaction.currency ?? 'FCFA'}
                    </Text>
                    <Text style={styles.metaText}>{new Date(transaction.createdAt).toLocaleString('fr-FR')}</Text>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title="Rendez-vous recents" />
            <View style={styles.list}>
              {(item.appointments ?? []).length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucun rendez-vous recent.</Text>
                </Card>
              ) : (
                (item.appointments ?? []).map((appointment: any) => (
                  <Pressable
                    key={appointment.id}
                    onPress={() => router.push(`/(admin)/appointment-detail?id=${appointment.id}` as never)}
                  >
                    <Card style={styles.card}>
                      <Text style={styles.cardTitle}>{appointment.service?.name ?? 'Service'}</Text>
                      <Text style={styles.metaText}>{appointment.salon?.name ?? 'Salon'}</Text>
                      <Text style={styles.metaText}>{new Date(appointment.startAt).toLocaleString('fr-FR')}</Text>
                      <Text style={styles.metaText}>{formatAppointmentStatus(appointment.status)}</Text>
                    </Card>
                  </Pressable>
                ))
              )}
            </View>

            <Button
              title={updateUser.isPending ? 'Enregistrement...' : 'Enregistrer la fiche client'}
              onPress={() => void handleSave()}
              disabled={updateUser.isPending}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  toggleRow: {
    gap: spacing.sm,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  toggleChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  toggleChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleChipTextActive: {
    color: colors.brandForeground,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  selectList: {
    gap: spacing.sm,
  },
  selectRow: {
    minHeight: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectRowSelected: {
    borderColor: colors.brand,
    backgroundColor: '#FBF5F6',
  },
  selectRowText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  selectCheck: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: '800',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceChipActive: {
    borderColor: colors.brand,
    backgroundColor: '#FBF5F6',
  },
  choiceChipDisabled: {
    opacity: 0.45,
  },
  choiceChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  choiceChipTextActive: {
    color: colors.brand,
    fontWeight: '800',
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
})

function formatAppointmentStatus(status?: string | null) {
  switch (status) {
    case 'PENDING':
      return 'En attente'
    case 'CONFIRMED':
      return 'Confirme'
    case 'COMPLETED':
      return 'Termine'
    case 'CANCELLED':
      return 'Annule'
    case 'NO_SHOW':
      return 'No-show'
    default:
      return status ?? 'Inconnu'
  }
}

