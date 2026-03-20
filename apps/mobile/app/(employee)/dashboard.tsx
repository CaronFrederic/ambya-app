import React, { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { EmployeeCalendarPicker } from '../../src/components/employee/EmployeeCalendarPicker'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { EmployeeModal } from '../../src/components/employee/EmployeeModal'
import { EmployeePickerField } from '../../src/components/employee/EmployeePickerField'
import { EmployeeSelectList } from '../../src/components/employee/EmployeeSelectList'
import { EmployeeTimePicker } from '../../src/components/employee/EmployeeTimePicker'
import {
  useCreateEmployeeBlockedSlot,
  useEmployeeDashboard,
} from '../../src/api/employee'
import { colors, overlays } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

type PickerType = 'date' | 'time' | 'service' | null

const quickActions = [
  {
    key: 'block',
    title: 'Bloquer un creneau',
    icon: 'calendar-clear-outline' as const,
    accent: true,
  },
  {
    key: 'appointments',
    title: 'Mes rendez-vous',
    icon: 'calendar-outline' as const,
  },
  {
    key: 'availability',
    title: 'Creneaux disponibles',
    icon: 'time-outline' as const,
  },
  {
    key: 'leave',
    title: 'Demande de conges',
    icon: 'document-text-outline' as const,
  },
]

export default function EmployeeDashboardScreen() {
  const dashboard = useEmployeeDashboard()
  const createBlockedSlot = useCreateEmployeeBlockedSlot()

  const [showBlockModal, setShowBlockModal] = useState(false)
  const [activePicker, setActivePicker] = useState<PickerType>(null)
  const [blockDate, setBlockDate] = useState('')
  const [blockTime, setBlockTime] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const profile = dashboard.data?.profile
  const services = dashboard.data?.services ?? []
  const todayItems = dashboard.data?.todayItems ?? []
  const selectedService = useMemo(
    () => services.find((item) => item.name === serviceName),
    [serviceName, services],
  )

  const onQuickAction = (key: string) => {
    if (key === 'block') {
      setShowBlockModal(true)
      return
    }
    if (key === 'appointments') {
      router.push('./appointments')
      return
    }
    if (key === 'availability') {
      router.push('./availability')
      return
    }
    router.push('./leave')
  }

  const resetBlockForm = () => {
    setShowBlockModal(false)
    setActivePicker(null)
    setBlockDate('')
    setBlockTime('')
    setServiceName('')
    setClientName('')
    setPhone('')
    setNote('')
    setErrors({})
  }

  const handleBlockSubmit = async () => {
    const nextErrors: Record<string, string> = {}

    if (!blockDate) nextErrors.blockDate = 'Selectionnez une date.'
    if (!blockTime) nextErrors.blockTime = 'Selectionnez une heure.'
    if (!selectedService) nextErrors.service = 'Selectionnez un service.'
    if (!clientName.trim()) nextErrors.clientName = 'Le nom du client est requis.'
    if (!phone.trim()) nextErrors.phone = 'Le telephone est requis.'

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !selectedService) return

    try {
      await createBlockedSlot.mutateAsync({
        startAt: toUtcIso(blockDate, blockTime),
        serviceId: selectedService.id,
        clientName: clientName.trim(),
        clientPhone: phone.trim(),
        note: note.trim() || undefined,
      })
      resetBlockForm()
      Alert.alert('Creneau bloque', 'Le creneau a bien ete ajoute a votre planning.')
    } catch (error: any) {
      Alert.alert('Impossible de bloquer ce creneau', error?.message ?? 'Erreur inconnue')
    }
  }

  if (dashboard.isLoading) {
    return (
      <Screen style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
      </Screen>
    )
  }

  if (dashboard.isError || !dashboard.data || !profile) {
    return (
      <Screen style={styles.loadingScreen}>
        <Text style={styles.loadingText}>
          Impossible de charger le flow employe.
        </Text>
      </Screen>
    )
  }

  return (
    <Screen noPadding style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <LinearGradient
          colors={[colors.brand, '#8B3747']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <EmployeeHeader
            title={`Bonjour ${profile.firstName || 'Employe'}`}
            subtitle={`${profile.role} - ${profile.salon}`}
            actionIcon="notifications-outline"
            onActionPress={() => {}}
            topInset={spacing.md}
          />

          <View style={styles.statsRow}>
            <SummaryStatCard
              label="Rendez-vous aujourd'hui"
              value={String(dashboard.data.metrics.todayCount)}
            />
            <SummaryStatCard
              label="Cette semaine"
              value={String(dashboard.data.metrics.weekCount)}
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.grid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => onQuickAction(action.key)}
                style={[styles.actionCard, action.accent && styles.actionCardAccent]}
              >
                <View style={[styles.actionIcon, action.accent && styles.actionIconAccent]}>
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={action.accent ? colors.brandForeground : colors.brand}
                  />
                </View>
                <Text style={[styles.actionTitle, action.accent && styles.actionTitleAccent]}>
                  {action.title}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rendez-vous du jour</Text>
            <Text style={styles.sectionMeta}>{formatFullDate(new Date())}</Text>
          </View>

          <View style={styles.list}>
            {todayItems.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aucun rendez-vous aujourd'hui</Text>
                <Text style={styles.emptyText}>
                  Les rendez-vous confirmes et les creneaux bloques apparaitront ici.
                </Text>
              </Card>
            ) : (
              todayItems.map((appointment) => (
                <Card key={`${appointment.kind}-${appointment.id}`} style={styles.appointmentCard}>
                  <View style={styles.appointmentTop}>
                    <View style={styles.avatar}>
                      <Ionicons name="person-outline" size={18} color={colors.brand} />
                    </View>

                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentName}>{appointment.clientName}</Text>
                      <Text style={styles.appointmentService}>{appointment.service.name}</Text>
                    </View>

                    <View style={styles.timePill}>
                      <Text style={styles.timePillText}>{formatTime(appointment.startAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.appointmentBottom}>
                    <View style={styles.inline}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>
                        {appointment.service.durationMin} min
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        router.push(
                          `./appointment-detail?id=${appointment.id}&kind=${appointment.kind}`,
                        )
                      }
                    >
                      <Text style={styles.linkText}>Voir details</Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <EmployeeModal
        visible={showBlockModal}
        title="Bloquer un creneau"
        onClose={resetBlockForm}
        footer={
          <>
            <Button title="Annuler" variant="secondary" onPress={resetBlockForm} style={styles.footerButton} />
            <Button
              title={createBlockedSlot.isPending ? 'Enregistrement...' : 'Bloquer le creneau'}
              onPress={handleBlockSubmit}
              style={styles.footerButton}
              disabled={createBlockedSlot.isPending}
            />
          </>
        }
      >
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.premium} />
          <Text style={styles.bannerText}>
            Ce creneau sera bloque uniquement pour vous et visible dans votre agenda.
          </Text>
        </View>

        <EmployeePickerField
          label="Date *"
          placeholder="jj/mm/aaaa"
          value={blockDate}
          onPress={() => setActivePicker((current) => (current === 'date' ? null : 'date'))}
          icon="calendar-outline"
          error={errors.blockDate}
        />
        {activePicker === 'date' ? (
          <EmployeeCalendarPicker
            value={blockDate}
            onChange={(option) => {
              setBlockDate(option)
              setActivePicker(null)
            }}
            onClear={() => {
              setBlockDate('')
              setActivePicker(null)
            }}
          />
        ) : null}

        <EmployeePickerField
          label="Heure *"
          placeholder="--:--"
          value={blockTime}
          onPress={() => setActivePicker((current) => (current === 'time' ? null : 'time'))}
          icon="time-outline"
          error={errors.blockTime}
        />
        {activePicker === 'time' ? (
          <EmployeeTimePicker
            value={blockTime}
            onChange={(option) => {
              setBlockTime(option)
              setActivePicker(null)
            }}
          />
        ) : null}

        <EmployeePickerField
          label="Service *"
          placeholder="Selectionner un service"
          value={serviceName}
          onPress={() => setActivePicker((current) => (current === 'service' ? null : 'service'))}
          icon="chevron-down"
          error={errors.service}
        />
        {activePicker === 'service' ? (
          <EmployeeSelectList
            options={services.map((item) => item.name)}
            value={serviceName}
            onSelect={(option) => {
              setServiceName(option)
              setActivePicker(null)
            }}
          />
        ) : null}

        <Input
          label="Nom du client *"
          placeholder="Ex: Marie Dupont"
          value={clientName}
          onChangeText={setClientName}
          error={errors.clientName}
        />

        <Input
          label="Telephone *"
          placeholder="+241 XX XX XX XX"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <Input
          label="Note (optionnelle)"
          placeholder="Informations complementaires..."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          inputStyle={styles.multilineInput}
        />
      </EmployeeModal>
    </Screen>
  )
}

function SummaryStatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFullDate(value: Date) {
  return value.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toUtcIso(date: string, time: string) {
  const [day, month, year] = date.split('/').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0)).toISOString()
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  loadingScreen: {
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text,
    ...typography.body,
    textAlign: 'center',
  },
  content: {
    paddingBottom: spacing.xl,
  },
  hero: {
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.82)',
    ...typography.small,
    fontWeight: '600',
  },
  statValue: {
    marginTop: spacing.md,
    color: colors.brandForeground,
    ...typography.h2,
    fontWeight: '800',
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    width: '48%',
    minHeight: 146,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionCardAccent: {
    backgroundColor: colors.brand,
    borderColor: '#7A3142',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: overlays.brand10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconAccent: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionTitle: {
    color: colors.text,
    ...typography.medium,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionTitleAccent: {
    color: colors.brandForeground,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.brand,
    ...typography.h3,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.textMuted,
    ...typography.small,
    textTransform: 'capitalize',
  },
  list: {
    gap: spacing.md,
  },
  emptyCard: {
    borderRadius: radius.xl,
  },
  emptyTitle: {
    color: colors.text,
    ...typography.medium,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    ...typography.body,
  },
  appointmentCard: {
    borderRadius: radius.xl,
  },
  appointmentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: overlays.brand05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentName: {
    color: colors.text,
    ...typography.medium,
    fontWeight: '700',
  },
  appointmentService: {
    marginTop: 2,
    color: colors.textMuted,
    ...typography.body,
  },
  timePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F7E8D4',
  },
  timePillText: {
    color: colors.brand,
    ...typography.small,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  appointmentBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
    ...typography.small,
  },
  linkText: {
    color: colors.brand,
    ...typography.small,
    fontWeight: '700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.4)',
    backgroundColor: '#FBF5E9',
  },
  bannerText: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    lineHeight: 22,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footerButton: {
    flex: 1,
  },
})
