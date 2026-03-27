import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { useAdminSalon, useUpdateAdminSalon } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle, AdminStatCard } from '../../src/components/AdminScaffold'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { requireOnlineAction } from '../../src/offline/guard'
import { useOfflineStatus } from '../../src/providers/OfflineProvider'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

type EditableService = {
  id: string
  name: string
  category: string
  price: string
  durationMin: string
  isActive: boolean
}

type OpeningHour = {
  day: string
  open: string | null
  close: string | null
  closed: boolean
}

const DEFAULT_OPENING_HOURS: OpeningHour[] = [
  { day: 'Lundi', open: '09:00', close: '19:00', closed: false },
  { day: 'Mardi', open: '09:00', close: '19:00', closed: false },
  { day: 'Mercredi', open: '09:00', close: '19:00', closed: false },
  { day: 'Jeudi', open: '09:00', close: '19:00', closed: false },
  { day: 'Vendredi', open: '09:00', close: '19:00', closed: false },
  { day: 'Samedi', open: '09:00', close: '18:00', closed: false },
  { day: 'Dimanche', open: null, close: null, closed: true },
]

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

export default function AdminSalonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isOffline } = useOfflineStatus()
  const { data, isLoading, isError, refetch } = useAdminSalon(id)
  const updateSalon = useUpdateAdminSalon()
  const item = data?.item as any

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(DEFAULT_OPENING_HOURS)
  const [services, setServices] = useState<EditableService[]>([])

  useEffect(() => {
    if (!item) return

    setName(item.name ?? '')
    setDescription(item.description ?? '')
    setAddress(item.address ?? '')
    setCity(item.city ?? '')
    setCountry(item.country ?? '')
    setPhone(item.phone ?? '')
    setIsActive(Boolean(item.isActive))
    setOpeningHours(normalizeOpeningHours(item.openingHours))
    setServices(
      (item.services ?? []).map((service: any) => ({
        id: service.id,
        name: service.name ?? '',
        category: service.category ?? 'OTHER',
        price: String(service.price ?? ''),
        durationMin: String(service.durationMin ?? ''),
        isActive: Boolean(service.isActive),
      })),
    )
  }, [item])

  const updateOpeningHour = (day: string, patch: Partial<OpeningHour>) => {
    setOpeningHours((current) =>
      current.map((entry) => {
        if (entry.day !== day) return entry
        const next = { ...entry, ...patch }
        if (next.closed) {
          return { ...next, open: null, close: null }
        }
        return {
          ...next,
          open: next.open || '09:00',
          close: next.close || '18:00',
        }
      }),
    )
  }

  const updateService = (serviceId: string, patch: Partial<EditableService>) => {
    setServices((current) =>
      current.map((service) => (service.id === serviceId ? { ...service, ...patch } : service)),
    )
  }

  const handleSave = async () => {
    if (!requireOnlineAction('mettre a jour un salon')) return

    try {
      await updateSalon.mutateAsync({
        id: id!,
        name,
        description,
        address,
        city,
        country,
        phone,
        isActive,
        openingHours: openingHours.map((entry) => ({
          day: entry.day,
          open: entry.closed ? null : entry.open,
          close: entry.closed ? null : entry.close,
          closed: entry.closed,
        })),
        services: services.map((service) => ({
          id: service.id,
          name: service.name.trim(),
          price: Number(service.price || 0),
          durationMin: Number(service.durationMin || 0),
          isActive: service.isActive,
        })),
      })
      Alert.alert('Modifications enregistrees', 'La fiche salon a ete mise a jour.')
      void refetch()
    } catch (error: any) {
      Alert.alert(
        'Mise a jour impossible',
        error?.response?.data?.message?.[0] ??
          error?.response?.data?.message ??
          'Impossible de mettre a jour ce salon.',
      )
    }
  }

  return (
    <Screen noPadding>
      <AdminHeader title="Fiche salon" subtitle="Support operationnel, activite et edition" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FeedbackState title="Chargement du salon" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError || !item ? (
          <FeedbackState
            title="Fiche salon indisponible"
            description="Impossible de charger ce salon pour le moment."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <AdminStatCard label="RDV" value={item.appointmentsCount ?? 0} />
              <AdminStatCard label="Employes" value={item.employeesCount ?? 0} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Transactions" value={item.analytics?.transactionsCount ?? 0} />
              <AdminStatCard label="CA" value={`${(item.analytics?.totalRevenue ?? 0).toLocaleString('fr-FR')} FCFA`} />
            </View>

            <AdminSectionTitle title="Edition salon" />
            <Card style={styles.card}>
              <Input value={name} onChangeText={setName} placeholder="Nom du salon" />
              <Input value={description} onChangeText={setDescription} placeholder="Description" />
              <Input value={address} onChangeText={setAddress} placeholder="Adresse" />
              <Input value={city} onChangeText={setCity} placeholder="Ville" />
              <Input value={country} onChangeText={setCountry} placeholder="Pays" />
              <Input value={phone} onChangeText={setPhone} placeholder="Telephone" />

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Statut du salon</Text>
                <View style={styles.toggleGroup}>
                  <ToggleChip label="Actif" active={isActive} onPress={() => setIsActive(true)} />
                  <ToggleChip label="Inactif" active={!isActive} onPress={() => setIsActive(false)} />
                </View>
              </View>
            </Card>

            <AdminSectionTitle title="Horaires d'ouverture" />
            <View style={styles.list}>
              {openingHours.map((entry) => (
                <Card key={entry.day} style={styles.card}>
                  <Text style={styles.cardTitle}>{entry.day}</Text>
                  <View style={styles.toggleGroup}>
                    <ToggleChip
                      label="Ouvert"
                      active={!entry.closed}
                      onPress={() => updateOpeningHour(entry.day, { closed: false })}
                    />
                    <ToggleChip
                      label="Ferme"
                      active={entry.closed}
                      onPress={() => updateOpeningHour(entry.day, { closed: true })}
                    />
                  </View>
                  <View style={styles.hourRow}>
                    <View style={styles.hourCol}>
                      <Input
                        value={entry.open ?? ''}
                        onChangeText={(value) => updateOpeningHour(entry.day, { open: value })}
                        placeholder="Ouverture"
                        editable={!entry.closed}
                      />
                    </View>
                    <View style={styles.hourCol}>
                      <Input
                        value={entry.close ?? ''}
                        onChangeText={(value) => updateOpeningHour(entry.day, { close: value })}
                        placeholder="Fermeture"
                        editable={!entry.closed}
                      />
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            <AdminSectionTitle title="Services lies" />
            <View style={styles.list}>
              {services.length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucun service rattache a ce salon.</Text>
                </Card>
              ) : (
                services.map((service) => (
                  <Card key={service.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{formatServiceCategory(service.category)}</Text>
                    <Input
                      value={service.name}
                      onChangeText={(value) => updateService(service.id, { name: value })}
                      placeholder="Nom du service"
                    />
                    <View style={styles.hourRow}>
                      <View style={styles.hourCol}>
                        <Input
                          value={service.price}
                          onChangeText={(value) => updateService(service.id, { price: value.replace(/[^\d]/g, '') })}
                          placeholder="Prix"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.hourCol}>
                        <Input
                          value={service.durationMin}
                          onChangeText={(value) =>
                            updateService(service.id, { durationMin: value.replace(/[^\d]/g, '') })
                          }
                          placeholder="Duree"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <View style={styles.toggleGroup}>
                      <ToggleChip
                        label="Actif"
                        active={service.isActive}
                        onPress={() => updateService(service.id, { isActive: true })}
                      />
                      <ToggleChip
                        label="Inactif"
                        active={!service.isActive}
                        onPress={() => updateService(service.id, { isActive: false })}
                      />
                    </View>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title="Employes lies" />
            <Card style={styles.card}>
              <Text style={styles.helperText}>
                Ouvre une fiche employee pour modifier son statut, ses specialites et son profil.
              </Text>
            </Card>
            <View style={styles.list}>
              {(item.employees ?? []).length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucun employe rattache a ce salon.</Text>
                </Card>
              ) : (
                (item.employees ?? []).map((employee: any) => (
                  <Pressable
                    key={employee.id}
                    onPress={() => router.push({ pathname: '/(admin)/employee-detail' as never, params: { id: employee.id } })}
                  >
                    <Card style={styles.card}>
                      <Text style={styles.cardTitle}>{employee.displayName}</Text>
                      <Text style={styles.metaText}>{employee.email ?? 'Email non renseigne'}</Text>
                      <Text style={styles.metaText}>{employee.phone ?? 'Telephone non renseigne'}</Text>
                      <Text style={styles.metaText}>{formatSpecialties(employee.specialties)}</Text>
                    </Card>
                  </Pressable>
                ))
              )}
            </View>

            <Button
              title={updateSalon.isPending ? 'Enregistrement...' : 'Enregistrer la fiche salon'}
              onPress={() => void handleSave()}
              disabled={updateSalon.isPending || isOffline}
            />

            <AdminSectionTitle title="Informations generales" />
            <Card style={styles.card}>
              <DetailRow label="Nom" value={item.name} />
              <DetailRow label="Statut" value={item.isActive ? 'Actif' : 'Inactif'} />
              <DetailRow label="Adresse" value={item.address} />
              <DetailRow label="Ville" value={item.city} />
              <DetailRow label="Pays" value={item.country} />
              <DetailRow label="Telephone" value={item.phone} />
              <DetailRow label="Description" value={item.description} />
            </Card>

            <AdminSectionTitle title="Professionnel lie" />
            <Card style={styles.card}>
              <DetailRow label="Email" value={item.owner?.email} />
              <DetailRow label="Telephone" value={item.owner?.phone} />
              <DetailRow label="Statut" value={item.owner?.isActive ? 'Actif' : 'Inactif'} />
            </Card>

            <AdminSectionTitle title="Rendez-vous recents" />
            <View style={styles.list}>
              {(item.appointments ?? []).length === 0 ? (
                <Card style={styles.card}><Text style={styles.emptyText}>Aucun rendez-vous recent pour ce salon.</Text></Card>
              ) : (
                (item.appointments ?? []).map((appointment: any) => (
                  <Pressable
                    key={appointment.id}
                    onPress={() => router.push({ pathname: '/(admin)/appointment-detail' as never, params: { id: appointment.id } })}
                  >
                    <Card style={styles.card}>
                      <Text style={styles.cardTitle}>{appointment.client?.name ?? 'Client'}</Text>
                      <Text style={styles.metaText}>{appointment.service?.name ?? 'Service'}</Text>
                      <Text style={styles.metaText}>{new Date(appointment.startAt).toLocaleString('fr-FR')}</Text>
                      <Text style={styles.metaText}>{formatAppointmentStatus(appointment.status)}</Text>
                    </Card>
                  </Pressable>
                ))
              )}
            </View>

            <AdminSectionTitle title="Transactions recentes" />
            <View style={styles.list}>
              {(item.payments ?? []).length === 0 ? (
                <Card style={styles.card}><Text style={styles.emptyText}>Aucune transaction disponible.</Text></Card>
              ) : (
                (item.payments ?? []).map((payment: any) => (
                  <Card key={payment.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{payment.status}</Text>
                    <Text style={styles.metaText}>{payment.provider ?? 'Provider non renseigne'}</Text>
                    <Text style={styles.metaText}>{`${(payment.amount ?? 0).toLocaleString('fr-FR')} ${payment.currency ?? 'FCFA'}`}</Text>
                    <Text style={styles.metaText}>{new Date(payment.createdAt).toLocaleString('fr-FR')}</Text>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title="Activite recente & avis" />
            <Card style={styles.card}>
              <DetailRow
                label="Top services"
                value={(item.analytics?.topServices ?? []).map((entry: any) => `${entry.label} (${entry.value})`).join(', ') || 'Aucun'}
              />
              <DetailRow label="Revenu AMBYA" value={`${(item.analytics?.ambyaRevenue ?? 0).toLocaleString('fr-FR')} FCFA`} />
            </Card>
            <View style={styles.list}>
              {(item.recentReviews ?? []).length === 0 ? (
                <Card style={styles.card}><Text style={styles.emptyText}>Aucun avis recent disponible.</Text></Card>
              ) : (
                (item.recentReviews ?? []).map((review: any) => (
                  <Card key={review.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{`${review.rating}/5 - ${review.clientName}`}</Text>
                    <Text style={styles.metaText}>{review.comment}</Text>
                    <Text style={styles.metaText}>{new Date(review.createdAt).toLocaleString('fr-FR')}</Text>
                  </Card>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

function normalizeOpeningHours(raw: unknown): OpeningHour[] {
  if (!Array.isArray(raw)) return DEFAULT_OPENING_HOURS

  const mapped = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const entry = item as Record<string, unknown>
      const day = typeof entry.day === 'string' ? entry.day : null
      if (!day) return null
      return {
        day,
        open: typeof entry.open === 'string' ? entry.open : null,
        close: typeof entry.close === 'string' ? entry.close : null,
        closed: Boolean(entry.closed),
      }
    })
    .filter((item): item is OpeningHour => Boolean(item))

  if (!mapped.length) return DEFAULT_OPENING_HOURS

  return DEFAULT_OPENING_HOURS.map(
    (fallback) => mapped.find((item) => item.day === fallback.day) ?? fallback,
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
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
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
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
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
    flexWrap: 'wrap',
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
  hourRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  hourCol: {
    flex: 1,
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

function formatServiceCategory(category?: string | null) {
  switch (category) {
    case 'HAIR':
      return 'Coiffure'
    case 'BARBER':
      return 'Barbier'
    case 'NAILS':
      return 'Ongles'
    case 'FACE':
      return 'Visage'
    case 'BODY':
      return 'Bien-etre'
    case 'FITNESS':
      return 'Fitness'
    case 'OTHER':
      return 'Autre'
    default:
      return category ?? 'Categorie non renseignee'
  }
}

function formatSpecialties(specialties?: string[] | null) {
  if (!specialties?.length) return 'Sans specialite'
  return specialties
    .map((entry) => {
      switch (entry) {
        case 'HAIR_STYLIST':
          return 'Coiffure'
        case 'BARBER':
          return 'Barbier'
        case 'ESTHETICIAN':
          return 'Esthetique'
        case 'MASSAGE_THERAPIST':
          return 'Massage'
        case 'MANICURIST':
          return 'Onglerie'
        case 'FITNESS_COACH':
          return 'Fitness'
        default:
          return entry
      }
    })
    .join(', ')
}
