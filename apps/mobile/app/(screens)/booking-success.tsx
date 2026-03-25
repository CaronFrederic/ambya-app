import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { useBooking } from '../../src/providers/BookingProvider'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

function formatFCFA(v: number) {
  return `${v.toLocaleString('fr-FR')} FCFA`
}

export default function BookingSuccessScreen() {
  const params = useLocalSearchParams<{
    salonName?: string
    serviceLabel?: string
    dateIso?: string
    timeLabel?: string
    totalAmount?: string
    paymentStatus?: string
    paymentMethod?: string
  }>()
  const { draft } = useBooking()

  const totalAmount = useMemo(() => {
    const parsed = Number(params.totalAmount)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
    return draft.cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
  }, [draft.cart, params.totalAmount])

  const salonName = params.salonName || draft.salonName || '-'
  const serviceLabel =
    params.serviceLabel ||
    (draft.cart?.length > 0 ? draft.cart.map((x) => x.name).join(' + ') : '-')
  const dateLabel = params.dateIso
    ? new Date(`${params.dateIso}T00:00:00.000Z`).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : draft.selectedDateIso
      ? new Date(`${draft.selectedDateIso}T00:00:00.000Z`).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '-'
  const timeLabel = params.timeLabel || draft.time || '-'
  const paymentStatus = params.paymentStatus || 'CREATED'
  const paymentMethod = params.paymentMethod || 'CASH'
  const isPaid = paymentStatus === 'SUCCEEDED'

  return (
    <Screen style={styles.screen} noPadding>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={[styles.checkCircle, isPaid ? styles.paidCircle : styles.pendingCircle]}>
            <Ionicons name={isPaid ? 'checkmark' : 'time-outline'} size={34} color="#fff" />
          </View>

          <Text style={styles.title}>
            {isPaid ? 'Paiement enregistré' : 'Demande de rendez-vous envoyée'}
          </Text>
          <Text style={styles.subtitle}>
            {isPaid
              ? 'Votre paiement beta interne a bien été enregistré. Le salon doit encore valider votre rendez-vous.'
              : paymentMethod === 'CASH'
                ? 'Votre rendez-vous est en attente de validation par le salon. Le paiement se fera sur place.'
                : 'Votre rendez-vous est en attente de validation par le salon.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardMuted}>Salon</Text>
          <Text style={styles.cardTitle}>{salonName}</Text>

          <View style={styles.splitRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{dateLabel}</Text>
            </View>

            <View style={{ width: spacing.lg }} />

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Heure</Text>
              <Text style={styles.value}>{timeLabel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>{serviceLabel}</Text>

          <Text style={[styles.label, { marginTop: spacing.md }]}>
            Paiement{' '}
            <Text style={{ color: colors.brand, fontWeight: '700' }}>
              {isPaid
                ? paymentMethod === 'CARD'
                  ? 'Carte enregistrée'
                  : paymentMethod === 'MOMO'
                    ? 'Mobile Money enregistré'
                    : 'Encaissé'
                : 'À régler'}
            </Text>
          </Text>

          {!!totalAmount && (
            <Text style={[styles.label, { marginTop: spacing.sm }]}>
              Montant{' '}
              <Text style={{ color: colors.brand, fontWeight: '700' }}>{formatFCFA(totalAmount)}</Text>
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.replace('/(tabs)/appointments')}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.primaryText}>Voir mes rendez-vous</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(tabs)/home')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.secondaryText}>Retour à l'accueil</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  top: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkCircle: {
    width: 78,
    height: 78,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  paidCircle: {
    backgroundColor: '#22C55E',
  },
  pendingCircle: {
    backgroundColor: '#D49B32',
  },
  title: {
    color: colors.text,
    ...typography.h2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    ...typography.small,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardMuted: {
    color: colors.textMuted,
    ...typography.small,
    textAlign: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    color: colors.text,
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    color: colors.textMuted,
    ...typography.small,
    marginBottom: 4,
  },
  value: {
    color: colors.text,
    ...typography.body,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: spacing.lg,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryText: {
    color: colors.brandForeground,
    ...typography.body,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.text,
    ...typography.body,
    fontWeight: '600',
  },
})
