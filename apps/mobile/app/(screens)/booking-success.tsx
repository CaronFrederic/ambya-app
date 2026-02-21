// app/(screens)/booking-success.tsx
import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
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
  const { draft } = useBooking()

  const totalAmount = useMemo(() => {
    return draft.cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
  }, [draft.cart])

  // Valeurs fallback (en attendant branchement API)
  const salonName = draft.salonName ?? 'Salon Élégance'
  const serviceLabel =
    draft.cart?.length > 0
      ? draft.cart.map((x) => x.name).slice(0, 2).join(' + ')
      : 'Coupe + Brushing'

    const dateLabel = draft.date ? `${draft.date.day} ${draft.date.date} Jan 2026` : '-'
    const timeLabel = draft.time ?? '-'

  return (
    <Screen style={styles.screen} noPadding>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={34} color="#fff" />
          </View>

          <Text style={styles.title}>Réservation confirmée!</Text>
          <Text style={styles.subtitle}>Votre rendez-vous a été réservé avec succès</Text>
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

          {/* si tu veux afficher le montant */}
          {!!totalAmount && (
            <Text style={[styles.label, { marginTop: spacing.md }]}>
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
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
    color: colors.brand,
    ...typography.body,
    fontWeight: '700',
  },
})
