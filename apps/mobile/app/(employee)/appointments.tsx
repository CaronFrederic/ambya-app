import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '../../src/components/Card'
import { Screen } from '../../src/components/Screen'
import { EmployeeChipTabs } from '../../src/components/employee/EmployeeChipTabs'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { useEmployeeFlow } from '../../src/features/employee/EmployeeFlowProvider'
import { colors, overlays } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

type AppointmentTab = 'all' | 'upcoming' | 'completed'

const tabOptions = [
  { key: 'all' as const, label: 'Tous' },
  { key: 'upcoming' as const, label: 'A venir' },
  { key: 'completed' as const, label: 'Termines' },
]

export default function EmployeeAppointmentsScreen() {
  const { appointments } = useEmployeeFlow()
  const [tab, setTab] = useState<AppointmentTab>('all')

  const filteredAppointments = useMemo(() => {
    if (tab === 'all') return appointments
    return appointments.filter((item) => item.status === tab)
  }, [appointments, tab])

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader
        title="Mes rendez-vous"
        subtitle="Gerez votre planning"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <EmployeeChipTabs options={tabOptions} value={tab} onChange={setTab} />

        <View style={styles.list}>
          {filteredAppointments.map((appointment) => (
            <Pressable
              key={appointment.id}
              onPress={() => router.push(`./appointment-detail?id=${appointment.id}`)}
            >
              <Card style={styles.card}>
                <View style={styles.topRow}>
                  <View style={styles.identityRow}>
                    <View style={styles.avatar}>
                      <Ionicons name="person-outline" size={18} color={colors.brand} />
                    </View>

                    <View style={styles.copy}>
                      <Text style={styles.name}>{appointment.clientName}</Text>
                      <Text style={styles.service}>{appointment.service}</Text>
                    </View>
                  </View>

                  <View style={styles.rightGroup}>
                    <View
                      style={[
                        styles.statusPill,
                        appointment.status === 'completed'
                          ? styles.completedPill
                          : styles.upcomingPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          appointment.status === 'completed'
                            ? styles.completedText
                            : styles.upcomingText,
                        ]}
                      >
                        {appointment.status === 'completed' ? 'Termine' : 'A venir'}
                      </Text>
                    </View>

                    {appointment.paid ? (
                      <View style={styles.paidPill}>
                        <Text style={styles.paidText}>Paye</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{appointment.date}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{appointment.time}</Text>
                  </View>
                </View>

                {appointment.status === 'completed' ? (
                  <>
                    <View style={styles.separator} />
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingLabel}>Evaluation :</Text>
                      <View style={styles.stars}>
                        {Array.from({ length: 5 }).map((_, index) => {
                          const filled = index < (appointment.rating ?? 0)
                          return (
                            <Ionicons
                              key={`${appointment.id}-${index}`}
                              name={filled ? 'star' : 'star-outline'}
                              size={16}
                              color={filled ? '#D4AF6A' : '#D0D0D0'}
                            />
                          )
                        })}
                      </View>
                    </View>
                  </>
                ) : null}
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
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
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingLabel: {
    color: colors.textMuted,
    ...typography.small,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
})
