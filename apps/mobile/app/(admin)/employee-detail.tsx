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
import { requireOnlineAction } from '../../src/offline/guard'
import { useOfflineStatus } from '../../src/providers/OfflineProvider'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

const EMPLOYEE_SPECIALTIES = [
  { value: 'HAIR_STYLIST', label: 'Coiffure' },
  { value: 'ESTHETICIAN', label: 'Esthetique' },
  { value: 'BARBER', label: 'Barbier' },
  { value: 'MASSAGE_THERAPIST', label: 'Massage / bien-etre' },
  { value: 'MANICURIST', label: 'Manucure' },
  { value: 'FITNESS_COACH', label: 'Coaching fitness' },
  { value: 'OTHER', label: 'Autre' },
] as const

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

export default function AdminEmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isOffline } = useOfflineStatus()
  const { data, isLoading, isError, refetch } = useAdminUser(id)
  const updateUser = useUpdateAdminUser()
  const item = data?.item as any

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [accountActive, setAccountActive] = useState(true)
  const [employeeActive, setEmployeeActive] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  useEffect(() => {
    if (!item) return
    setEmail(item.email ?? '')
    setPhone(item.phone ?? '')
    setAccountActive(Boolean(item.isActive))
    setEmployeeActive(Boolean(item.employeeProfile?.isActive))
    setFirstName(item.employeeProfile?.firstName ?? '')
    setLastName(item.employeeProfile?.lastName ?? '')
    setDisplayName(item.employeeProfile?.displayName ?? '')
    setSelectedSpecialties(Array.isArray(item.employeeProfile?.specialties) ? item.employeeProfile.specialties : [])
  }, [item])

  const selectedSpecialtyLabels = useMemo(
    () =>
      EMPLOYEE_SPECIALTIES.filter((entry) => selectedSpecialties.includes(entry.value))
        .map((entry) => entry.label)
        .join(', '),
    [selectedSpecialties],
  )

  const recentAppointments = item?.employeeProfile?.appointments ?? []

  const toggleSpecialty = (value: string) => {
    setSelectedSpecialties((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    )
  }

  const handleSave = async () => {
    if (!requireOnlineAction('mettre a jour une fiche employee')) return

    try {
      await updateUser.mutateAsync({
        id: id!,
        email,
        phone,
        isActive: accountActive,
        firstName,
        lastName,
        displayName,
        employeeIsActive: employeeActive,
        specialties: selectedSpecialties,
      })
      Alert.alert('Modifications enregistrees', "La fiche employee a ete mise a jour.")
      void refetch()
    } catch (error: any) {
      Alert.alert(
        'Mise a jour impossible',
        error?.response?.data?.message?.[0] ??
          error?.response?.data?.message ??
          "Impossible de mettre a jour cette fiche employee.",
      )
    }
  }

  return (
    <Screen noPadding>
      <AdminHeader title="Fiche employee" subtitle="Support, informations metier et disponibilite" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FeedbackState title="Chargement de la fiche employee" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError || !item ? (
          <FeedbackState
            title="Fiche employee indisponible"
            description="Impossible de charger cette fiche pour le moment."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <AdminStatCard label="RDV recents" value={recentAppointments.length} />
              <AdminStatCard label="Specialites" value={selectedSpecialties.length} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Compte" value={accountActive ? 'Actif' : 'Inactif'} />
              <AdminStatCard label="Profil employee" value={employeeActive ? 'Actif' : 'Inactif'} />
            </View>

            <AdminSectionTitle title="Compte & identite" />
            <Card style={styles.card}>
              <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
              <Input value={phone} onChangeText={setPhone} placeholder="Telephone" />
              <Input value={firstName} onChangeText={setFirstName} placeholder="Prenom" />
              <Input value={lastName} onChangeText={setLastName} placeholder="Nom" />
              <Input value={displayName} onChangeText={setDisplayName} placeholder="Nom affiche" />

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Compte utilisateur</Text>
                <View style={styles.toggleGroup}>
                  <ToggleChip label="Actif" active={accountActive} onPress={() => setAccountActive(true)} />
                  <ToggleChip label="Inactif" active={!accountActive} onPress={() => setAccountActive(false)} />
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Profil employee</Text>
                <View style={styles.toggleGroup}>
                  <ToggleChip label="Actif" active={employeeActive} onPress={() => setEmployeeActive(true)} />
                  <ToggleChip label="Inactif" active={!employeeActive} onPress={() => setEmployeeActive(false)} />
                </View>
              </View>
            </Card>

            <AdminSectionTitle title="Contexte metier" />
            <Card style={styles.card}>
              <DetailRow label="Role" value={item.role} />
              <DetailRow label="Salon" value={item.employeeProfile?.salon?.name ?? item.salonName} />
              <DetailRow label="Nom support" value={item.displayName} />
              <DetailRow label="Specialites selectionnees" value={selectedSpecialtyLabels || 'Aucune specialite'} />
            </Card>

            <AdminSectionTitle title="Specialites employee" />
            <Card style={styles.card}>
              <Text style={styles.helperText}>
                Selectionne les specialites que l'employee peut reellement prendre en charge.
              </Text>
              <View style={styles.chipGrid}>
                {EMPLOYEE_SPECIALTIES.map((entry) => (
                  <ToggleChip
                    key={entry.value}
                    label={entry.label}
                    active={selectedSpecialties.includes(entry.value)}
                    onPress={() => toggleSpecialty(entry.value)}
                  />
                ))}
              </View>
            </Card>

            <AdminSectionTitle title="Rendez-vous recents" />
            <View style={styles.list}>
              {recentAppointments.length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucun rendez-vous recent pour cet employee.</Text>
                </Card>
              ) : (
                recentAppointments.map((appointment: any) => (
                  <Pressable
                    key={appointment.id}
                    onPress={() => router.push(`/(admin)/appointment-detail?id=${appointment.id}` as never)}
                  >
                    <Card style={styles.card}>
                      <Text style={styles.cardTitle}>{appointment.service?.name ?? 'Service'}</Text>
                      <Text style={styles.metaText}>{appointment.salon?.name ?? 'Salon'}</Text>
                      <Text style={styles.metaText}>{appointment.client?.name ?? 'Client'}</Text>
                      <Text style={styles.metaText}>{new Date(appointment.startAt).toLocaleString('fr-FR')}</Text>
                      <Text style={styles.metaText}>{formatAppointmentStatus(appointment.status)}</Text>
                    </Card>
                  </Pressable>
                ))
              )}
            </View>

            <Button
              title={updateUser.isPending ? 'Enregistrement...' : "Enregistrer la fiche employee"}
              onPress={() => void handleSave()}
              disabled={updateUser.isPending || isOffline}
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
    flexWrap: 'wrap',
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
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
