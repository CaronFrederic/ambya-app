import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '../../src/components/Card'
import { Screen } from '../../src/components/Screen'
import { FeedbackState } from '../../src/components/FeedbackState'
import { EmployeeChipTabs } from '../../src/components/employee/EmployeeChipTabs'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { useEmployeeSchedule, type EmployeeScheduleTab } from '../../src/api/employee-portal'
import { colors, overlays } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

const tabOptions = [
  { key: 'all' as const, label: 'Tous' },
  { key: 'upcoming' as const, label: 'A venir' },
  { key: 'completed' as const, label: 'Termines' },
]

export default function EmployeeAppointmentsScreen() {
  const [tab, setTab] = useState<EmployeeScheduleTab>('all')
  const schedule = useEmployeeSchedule(tab)

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader title="Mes rendez-vous" subtitle="Gerez votre planning" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <EmployeeChipTabs options={tabOptions} value={tab} onChange={setTab} />

        <View style={styles.list}>
          {schedule.isLoading ? (
            <FeedbackState
              icon="time-outline"
              title="Chargement de votre agenda"
              description="Vos rendez-vous et creneaux bloques arrivent."
            />
          ) : schedule.isError ? (
            <FeedbackState
              icon="alert-circle-outline"
              title="Impossible de charger l agenda"
              description="Reessayez dans un instant."
              actionLabel="Reessayer"
              onAction={() => void schedule.refetch()}
            />
          ) : (schedule.data?.items.length ?? 0) === 0 ? (
            <FeedbackState
              icon="calendar-clear-outline"
              title="Aucun rendez-vous"
              description="Aucun element ne correspond a ce filtre pour le moment."
            />
          ) : (
            schedule.data?.items.map((appointment) => (
              <Pressable
                key={`${appointment.kind}-${appointment.id}`}
                onPress={() =>
                  router.push(`./appointment-detail?id=${appointment.id}&kind=${appointment.kind}`)
                }
              >
                <Card style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={styles.identityRow}>
                      <View style={styles.avatar}>
                        <Ionicons name="person-outline" size={18} color={colors.brand} />
                      </View>

                      <View style={styles.copy}>
                        <Text style={styles.name}>{appointment.clientName}</Text>
                        <Text style={styles.service}>{appointment.service.name}</Text>
                      </View>
                    </View>

                    <View style={styles.rightGroup}>
                      <View
                        style={[
                          styles.statusPill,
                          appointment.status === 'COMPLETED'
                            ? styles.completedPill
                            : styles.upcomingPill,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            appointment.status === 'COMPLETED'
                              ? styles.completedText
                              : styles.upcomingText,
                          ]}
                        >
                          {appointment.status === 'COMPLETED'
                            ? 'Termine'
                            : appointment.status === 'CONFIRMED'
                              ? 'Confirme'
                              : 'En attente'}
                        </Text>
                      </View>

                      {appointment.isPaid ? (
                        <View style={styles.paidPill}>
                          <Text style={styles.paidText}>Paye</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{formatDate(appointment.startAt)}</Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{formatTime(appointment.startAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name={appointment.kind === 'blocked_slot' ? 'briefcase-outline' : 'sparkles-outline'}
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {appointment.kind === 'blocked_slot' ? 'Bloque en salon' : 'Rendez-vous client'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR')
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: overlays.brand05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.text,
    ...typography.medium,
    fontWeight: '700',
  },
  service: {
    marginTop: 2,
    color: colors.textMuted,
    ...typography.body,
  },
  rightGroup: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  upcomingPill: {
    backgroundColor: '#DDE7FF',
  },
  completedPill: {
    backgroundColor: colors.successSoft,
  },
  statusText: {
    ...typography.small,
    fontWeight: '700',
  },
  upcomingText: {
    color: '#315CDE',
  },
  completedText: {
    color: colors.successText,
  },
  paidPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#E7F6EA',
  },
  paidText: {
    color: '#12733B',
    ...typography.caption,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
    ...typography.small,
  },
})

