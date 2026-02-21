import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen, Card, Button } from '../../src/components'
import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

function formatFCFA(v: number) {
  return `${v.toLocaleString('fr-FR')} FCFA`
}

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams<{ amount?: string }>()
  const amount = useMemo(() => {
    const n = Number(params.amount)
    return Number.isFinite(n) && n > 0 ? n : 15000
  }, [params.amount])

  const onContinue = () => {
    // Exemple : retour appointments (adapte si tu veux aller vers "appointments")
    router.replace('/(screens)/booking-success')
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.centerWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={28} color="#fff" />
        </View>

        <Text style={styles.title}>Paiement effectué avec succès!</Text>
        <Text style={styles.subtitle}>Votre paiement a été traité avec succès</Text>

        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.smallMuted}>Montant payé</Text>
            <Text style={styles.amount}>{formatFCFA(amount)}</Text>
          </View>

          <View style={styles.hr} />

          <Text style={styles.smallMutedCenter}>Préparation de votre réservation...</Text>
        </Card>

        <View style={{ height: spacing.xl }} />

        <Button title="Continuer" onPress={onContinue} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },

  centerWrap: {
    alignItems: 'center',
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.promo,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  title: {
    color: colors.text,
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  card: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  cardTop: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  smallMuted: {
    color: colors.textMuted,
    ...typography.small,
  },

  amount: {
    color: colors.brand,
    ...typography.h3,
    fontWeight: '800',
  },

  hr: {
    height: 1,
    backgroundColor: 'rgba(107,39,55,0.10)',
    marginVertical: spacing.lg,
  },

  smallMutedCenter: {
    color: colors.textMuted,
    ...typography.small,
    textAlign: 'center',
  },
})
