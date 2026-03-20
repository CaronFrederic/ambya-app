import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Screen } from '../../src/components/Screen'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { useClaimEmployeeSlot, useEmployeeAvailableSlots } from '../../src/api/employee'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function EmployeeAvailabilityScreen() {
  const availableSlots = useEmployeeAvailableSlots()
  const claimSlot = useClaimEmployeeSlot()

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader
        title="Creneaux disponibles"
        subtitle="Rendez-vous non assignes"
        canGoBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <View style={styles.infoBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#D4AF6A" />
          <Text style={styles.infoText}>
            Ces rendez-vous clients ne sont encore assignes a aucun employe.
          </Text>
        </View>

        <View style={styles.list}>
          {availableSlots.isLoading ? (
            <Text style={styles.feedbackText}>Chargement des creneaux...</Text>
          ) : availableSlots.isError ? (
            <Text style={styles.feedbackText}>Impossible de charger les creneaux.</Text>
          ) : (availableSlots.data?.items.length ?? 0) === 0 ? (
            <Card style={styles.card}>
              <Text style={styles.service}>Aucun creneau disponible</Text>
              <Text style={styles.metaText}>Tout est deja pris en charge pour le moment.</Text>
            </Card>
          ) : (
            availableSlots.data?.items.map((slot) => (
              <Card key={slot.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.service}>{slot.service.name}</Text>
                  <View style={[styles.badge, !slot.isClaimable && styles.badgeMuted]}>
                    <Text style={[styles.badgeText, !slot.isClaimable && styles.badgeTextMuted]}>
                      {slot.isClaimable ? 'Non assigne' : 'Conflit agenda'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.clientName}>{slot.clientName}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{formatDate(slot.startAt)}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  {slot.clientPhone ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{slot.clientPhone}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaItem}>
                    <Ionicons name="wallet-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{formatAmount(slot.amount)}</Text>
                  </View>
                </View>

                <Button
                  title={claimSlot.isPending ? 'Attribution...' : 'Prendre en charge'}
                  onPress={async () => {
                    try {
                      await claimSlot.mutateAsync({ id: slot.id })
                      Alert.alert('Creneau assigne', 'Le creneau a ete ajoute a votre agenda.')
                    } catch (error: any) {
                      Alert.alert('Action impossible', error?.message ?? 'Erreur inconnue')
                    }
                  }}
                  style={styles.button}
                  disabled={claimSlot.isPending || !slot.isClaimable}
                />
              </Card>
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

function formatAmount(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.4)',
    backgroundColor: '#FBF5E9',
  },
  infoText: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    lineHeight: 22,
  },
  feedbackText: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  service: {
    color: colors.text,
    ...typography.h3,
    fontWeight: '700',
    flex: 1,
  },
  clientName: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    ...typography.body,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#FDE7D0',
  },
  badgeMuted: {
    backgroundColor: '#ECEAE7',
  },
  badgeText: {
    color: '#D2691E',
    ...typography.small,
    fontWeight: '700',
  },
  badgeTextMuted: {
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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
  button: {
    marginTop: spacing.lg,
  },
})
