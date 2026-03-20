import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Screen } from '../../src/components/Screen'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import {
  useCompleteEmployeeScheduleItem,
  useConfirmEmployeeScheduleItem,
  useEmployeeScheduleItem,
  usePayEmployeeScheduleItem,
} from '../../src/api/employee'
import { colors, overlays } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function EmployeeAppointmentDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; kind?: string }>()
  const id = typeof params.id === 'string' ? params.id : undefined
  const kind = typeof params.kind === 'string' ? params.kind : undefined

  const detail = useEmployeeScheduleItem(kind, id)
  const confirmMutation = useConfirmEmployeeScheduleItem()
  const completeMutation = useCompleteEmployeeScheduleItem()
  const payMutation = usePayEmployeeScheduleItem()

  if (!kind || !id) {
    return (
      <Screen style={styles.screen}>
        <Text style={styles.missingText}>Rendez-vous introuvable.</Text>
      </Screen>
    )
  }

  if (detail.isLoading) {
    return (
      <Screen style={styles.screen}>
        <Text style={styles.missingText}>Chargement du rendez-vous...</Text>
      </Screen>
    )
  }

  if (detail.isError || !detail.data?.item) {
    return (
      <Screen style={styles.screen}>
        <Text style={styles.missingText}>Impossible de charger ce rendez-vous.</Text>
      </Screen>
    )
  }

  const appointment = detail.data.item

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync({ kind, id })
      Alert.alert('Rendez-vous confirme', 'Le rendez-vous a ete pris en charge.')
    } catch (error: any) {
      Alert.alert('Action impossible', error?.message ?? 'Erreur inconnue')
    }
  }

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({ kind, id })
      Alert.alert('Rendez-vous termine', 'Le rendez-vous a ete marque comme termine.')
    } catch (error: any) {
      Alert.alert('Action impossible', error?.message ?? 'Erreur inconnue')
    }
  }

  const handlePaid = async () => {
    try {
      await payMutation.mutateAsync({ kind, id })
      Alert.alert('Paiement enregistre', 'Le rendez-vous a ete marque comme paye.')
    } catch (error: any) {
      Alert.alert('Action impossible', error?.message ?? 'Erreur inconnue')
    }
  }

  const isPending = confirmMutation.isPending || completeMutation.isPending || payMutation.isPending
  const canConfirm = appointment.kind === 'appointment' && appointment.status === 'PENDING'
  const canComplete = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
  const canPay = !appointment.isPaid

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader
        title="Detail du rendez-vous"
        subtitle={`${appointment.clientName} - ${appointment.service.name}`}
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
            <View style={styles.mainCopy}>
              <Text style={styles.clientName}>{appointment.clientName}</Text>
              <Text style={styles.serviceName}>{appointment.service.name}</Text>
            </View>

            <View style={styles.statusGroup}>
              <View
                style={[
                  styles.statusPill,
                  appointment.status === 'COMPLETED' ? styles.donePill : styles.upcomingPill,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    appointment.status === 'COMPLETED' ? styles.doneText : styles.upcomingText,
                  ]}
                >
                  {appointment.status === 'COMPLETED'
                    ? 'Termine'
                    : appointment.status === 'CONFIRMED'
                      ? 'Confirme'
                      : 'En attente'}
                </Text>
              </View>

              <View style={[styles.statusPill, appointment.isPaid ? styles.paidPill : styles.unpaidPill]}>
                <Text style={[styles.statusText, appointment.isPaid ? styles.paidText : styles.unpaidText]}>
                  {appointment.isPaid ? 'Paye' : 'A encaisser'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MetaInfo icon="calendar-outline" label={formatDate(appointment.startAt)} />
            <MetaInfo icon="time-outline" label={`${formatTime(appointment.startAt)} - ${formatTime(appointment.endAt)}`} />
            <MetaInfo icon="wallet-outline" label={formatAmount(appointment.amount)} />
          </View>

          <View style={styles.separator} />

          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.metaRow}>
            <MetaInfo icon="person-outline" label={appointment.client.name} />
            {appointment.client.phone ? <MetaInfo icon="call-outline" label={appointment.client.phone} /> : null}
            {appointment.client.email ? <MetaInfo icon="mail-outline" label={appointment.client.email} /> : null}
          </View>

          {appointment.note ? (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionTitle}>Note prestation</Text>
              <Text style={styles.noteText}>{appointment.note}</Text>
            </>
          ) : null}
        </Card>

        {appointment.insights.map((section) => (
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
          {canConfirm ? (
            <Button
              title={confirmMutation.isPending ? 'Confirmation...' : 'Prendre en charge / confirmer'}
              onPress={handleConfirm}
              disabled={isPending}
              style={styles.actionButton}
            />
          ) : null}
          <Button
            title={
              appointment.status === 'COMPLETED'
                ? 'Rendez-vous deja termine'
                : completeMutation.isPending
                  ? 'Validation...'
                  : 'Marquer comme termine'
            }
            onPress={handleComplete}
            disabled={isPending || !canComplete}
            style={styles.actionButton}
          />
          <Button
            title={
              appointment.isPaid
                ? 'Paiement deja enregistre'
                : payMutation.isPending
                  ? 'Enregistrement...'
                  : 'Marquer comme paye'
            }
            onPress={handlePaid}
            disabled={isPending || !canPay}
            variant={appointment.isPaid ? 'secondary' : 'outline'}
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR')
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`
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
  mainCopy: {
    flex: 1,
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
