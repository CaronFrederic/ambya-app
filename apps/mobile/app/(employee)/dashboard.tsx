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
import { useEmployeeFlow } from '../../src/features/employee/EmployeeFlowProvider'
import { services } from '../../src/features/employee/data'
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
  const { appointments, profile, blockSlot } = useEmployeeFlow()
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [activePicker, setActivePicker] = useState<PickerType>(null)
  const [blockDate, setBlockDate] = useState('')
  const [blockTime, setBlockTime] = useState('')
  const [service, setService] = useState('')
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState(profile.phone)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const todayAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'upcoming'),
    [appointments],
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
    setService('')
    setClientName('')
    setPhone(profile.phone)
    setNote('')
    setErrors({})
  }

  const handleBlockSubmit = () => {
    const nextErrors: Record<string, string> = {}

    if (!blockDate) nextErrors.blockDate = 'Selectionnez une date.'
    if (!blockTime) nextErrors.blockTime = 'Selectionnez une heure.'
    if (!service) nextErrors.service = 'Selectionnez un service.'
    if (!clientName.trim()) nextErrors.clientName = 'Le nom du client est requis.'
    if (!phone.trim()) nextErrors.phone = 'Le telephone est requis.'

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    blockSlot({
      date: blockDate,
      time: blockTime,
      service,
      clientName: clientName.trim(),
      phone: phone.trim(),
      note: note.trim(),
    })

    resetBlockForm()
    Alert.alert('Creneau bloque', 'Le creneau a bien ete ajoute a votre planning.')
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
            title={`Bonjour ${profile.firstName}`}
            subtitle={`${profile.role} - ${profile.salon}`}
            actionIcon="notifications-outline"
            onActionPress={() => {}}
            topInset={spacing.md}
          />

          <View style={styles.statsRow}>
            <SummaryStatCard label="Rendez-vous aujourd'hui" value={String(todayAppointments.length)} />
            <SummaryStatCard label="Cette semaine" value="23" />
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
            <Text style={styles.sectionMeta}>Mercredi 28 Jan 2026</Text>
          </View>

          <View style={styles.list}>
            {todayAppointments.map((appointment) => (
              <Card key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentTop}>
                  <View style={styles.avatar}>
                    <Ionicons name="person-outline" size={18} color={colors.brand} />
                  </View>

                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentName}>{appointment.clientName}</Text>
                    <Text style={styles.appointmentService}>{appointment.service}</Text>
                  </View>

                  <View style={styles.timePill}>
                    <Text style={styles.timePillText}>{appointment.time}</Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.appointmentBottom}>
                  <View style={styles.inline}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{appointment.duration}</Text>
                  </View>

                  <Pressable onPress={() => router.push(`./appointment-detail?id=${appointment.id}`)}>
                    <Text style={styles.linkText}>Voir details</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>

          <LinearGradient
            colors={['#D4AF6A', '#E2BF7C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.performanceCard}
          >
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceTitle}>Performance ce mois</Text>
              <Ionicons name="star-outline" size={18} color={colors.brandForeground} />
            </View>

            <View style={styles.performanceRow}>
              <PerformanceMetric label="Clients" value="87" />
              <PerformanceMetric label="Note moyenne" value="4.9" />
              <PerformanceMetric label="Heures" value="156h" />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      <EmployeeModal
        visible={showBlockModal}
        title="Bloquer un creneau"
        onClose={resetBlockForm}
        footer={
          <>
            <Button title="Annuler" variant="secondary" onPress={resetBlockForm} style={styles.footerButton} />
            <Button title="Bloquer le creneau" onPress={handleBlockSubmit} style={styles.footerButton} />
          </>
        }
      >
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.premium} />
          <Text style={styles.bannerText}>
            Une notification sera automatiquement envoyee au professionnel et le calendrier sera mis a jour.
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
          value={service}
          onPress={() => setActivePicker((current) => (current === 'service' ? null : 'service'))}
          icon="chevron-down"
          error={errors.service}
        />
        {activePicker === 'service' ? (
          <EmployeeSelectList
            options={services}
            value={service}
            onSelect={(option) => {
              setService(option)
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

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.performanceMetric}>
      <Text style={styles.performanceMetricLabel}>{label}</Text>
      <Text style={styles.performanceMetricValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
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
  },
  list: {
    gap: spacing.md,
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
  performanceCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  performanceTitle: {
    color: colors.brandForeground,
    ...typography.h3,
    fontWeight: '800',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  performanceMetric: {
    flex: 1,
  },
  performanceMetricLabel: {
    color: 'rgba(255,255,255,0.85)',
    ...typography.small,
    fontWeight: '600',
  },
  performanceMetricValue: {
    marginTop: spacing.xs,
    color: colors.brandForeground,
    ...typography.h2,
    fontWeight: '800',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FBF5E9',
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.4)',
  },
  bannerText: {
    flex: 1,
    color: colors.text,
    ...typography.small,
    lineHeight: 18,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footerButton: {
    flex: 1,
  },
  inlinePicker: {
    marginTop: -4,
  },
})
