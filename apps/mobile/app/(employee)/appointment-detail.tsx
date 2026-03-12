import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Screen } from '../../src/components/Screen'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { useEmployeeFlow } from '../../src/features/employee/EmployeeFlowProvider'
import { colors, overlays } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function EmployeeAppointmentDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const { findAppointment, markAppointmentCompleted, markAppointmentPaid } = useEmployeeFlow()
  const appointment = findAppointment(String(params.id ?? ''))

  if (!appointment) {
    return (
      <Screen style={styles.screen}>
        <Text style={styles.missingText}>Rendez-vous introuvable.</Text>
      </Screen>
    )
  }

  const handleComplete = () => {
    markAppointmentCompleted(appointment.id)
    Alert.alert('Rendez-vous termine', 'Le rendez-vous a ete marque comme termine.')
  }

  const handlePaid = () => {
    markAppointmentPaid(appointment.id)
    Alert.alert('Paiement enregistre', 'Le rendez-vous a ete marque comme paye.')
  }

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader
        title="Detail du rendez-vous"
        subtitle={`${appointment.clientName} - ${appointment.service}`}
        canGoBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <Card style={styles.card}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.clientName}>{appointment.clientName}</Text>
              <Text style={styles.serviceName}>{appointment.service}</Text>
            </View>

            <View style={styles.statusGroup}>
              <View style={[styles.statusPill, appointment.status === 'completed' ? styles.donePill : styles.upcomingPill]}>
                <Text style={[styles.statusText, appointment.status === 'completed' ? styles.doneText : styles.upcomingText]}>
                  {appointment.status === 'completed' ? 'Termine' : 'A venir'}
                </Text>
              </View>

              <View style={[styles.statusPill, appointment.paid ? styles.paidPill : styles.unpaidPill]}>
                <Text style={[styles.statusText, appointment.paid ? styles.paidText : styles.unpaidText]}>
                  {appointment.paid ? 'Paye' : 'A encaisser'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MetaInfo icon="calendar-outline" label={appointment.date} />
            <MetaInfo icon="time-outline" label={appointment.time} />
            <MetaInfo icon="wallet-outline" label={appointment.priceLabel} />
          </View>

          {appointment.note ? (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionTitle}>Note prestation</Text>
              <Text style={styles.noteText}>{appointment.note}</Text>
            </>
          ) : null}
        </Card>

        {appointment.clientInsights.map((section) => (
          <Card key={section.title} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.insightList}>
              {section.items.map((item) => (
                <View key={item} style={styles.insightItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.insightText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}

        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Button
            title={appointment.status === 'completed' ? 'Rendez-vous deja termine' : 'Marquer comme termine'}
            onPress={handleComplete}
            disabled={appointment.status === 'completed'}
            style={styles.actionButton}
          />
          <Button
            title={appointment.paid ? 'Paiement deja enregistre' : 'Marquer comme paye'}
            onPress={handlePaid}
            disabled={appointment.paid}
            variant={appointment.paid ? 'secondary' : 'outline'}
            style={styles.actionButton}
          />
          <Button
            title="Retour a l agenda"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.actionButton}
          />
        </Card>
      </ScrollView>
    </Screen>
  )
}

function MetaInfo({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  missingText: {
    color: colors.text,
    ...typography.body,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.xl,
  },
  actionsCard: {
    borderRadius: radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  clientName: {
    color: colors.text,
    ...typography.h3,
    fontWeight: '700',
  },
  serviceName: {
    marginTop: 4,
    color: colors.textMuted,
    ...typography.body,
  },
  statusGroup: {
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
  donePill: {
    backgroundColor: colors.successSoft,
  },
  paidPill: {
    backgroundColor: '#E7F6EA',
  },
  unpaidPill: {
    backgroundColor: '#FDE7D0',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  upcomingText: {
    color: '#315CDE',
  },
  doneText: {
    color: colors.successText,
  },
  paidText: {
    color: '#12733B',
  },
  unpaidText: {
    color: '#C96C1A',
  },
  metaRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  sectionTitle: {
    color: colors.brand,
    ...typography.medium,
    fontWeight: '700',
  },
  noteText: {
    marginTop: spacing.sm,
    color: colors.text,
    ...typography.body,
  },
  insightList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginTop: 7,
    backgroundColor: overlays.brand20,
  },
  insightText: {
    flex: 1,
    color: colors.text,
    ...typography.body,
  },
  actionButton: {
    marginTop: spacing.md,
  },
})
