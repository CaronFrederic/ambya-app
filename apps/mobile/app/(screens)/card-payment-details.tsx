import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen, Card, Input, Button } from '../../src/components'
import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

function formatFCFA(v: number) {
  return `${v.toLocaleString('fr-FR')} FCFA`
}

// Petit formatage (UI only)
function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  const parts = digits.match(/.{1,4}/g) ?? []
  return parts.join(' ')
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export default function CardPaymentDetailsScreen() {
  // Optionnel: tu peux passer amount en param via route: router.push({ pathname: '/(screens)/card-payment-details', params: { amount: '15000' } })
  const params = useLocalSearchParams<{ amount?: string }>()
  const amount = useMemo(() => {
    const n = Number(params.amount)
    return Number.isFinite(n) && n > 0 ? n : 15000
  }, [params.amount])

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const canPay =
    cardNumber.replace(/\D/g, '').length === 16 &&
    expiry.replace(/\D/g, '').length >= 4 &&
    cvv.replace(/\D/g, '').length >= 3

  const onPay = () => {
    // UX: on simule un paiement réussi
    router.replace({ pathname: '/(screens)/payment-success', params: { amount: String(amount) } })
  }

  return (
    <Screen noPadding style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* HEADER BORDEAUX */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
          </Pressable>

          <Text style={styles.headerTitle}>Paiement par carte</Text>
        </View>

        {/* BODY */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.md }}>
            {/* Numéro de carte */}
            <View>
              <Text style={styles.label}>Numéro de carte</Text>
              <Input
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                keyboardType="number-pad"
              />
            </View>

            {/* Exp + CVV */}
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date d&apos;expiration</Text>
                <Input
                  placeholder="MM/AA"
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CVV</Text>
                <Input
                  placeholder="123"
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>
            </View>

            {/* Montant */}
            <Card style={styles.amountCard}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Montant à payer</Text>
                <Text style={styles.amountValue}>{formatFCFA(amount)}</Text>
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* CTA BOTTOM */}
        <View style={styles.bottomCta}>
          <Button title={`Payer ${formatFCFA(amount)}`} onPress={onPay} disabled={!canPay} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  headerTitle: {
    color: colors.brandForeground,
    ...typography.h2,
  },

  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140, // laisse la place au bouton fixe
  },

  label: {
    color: colors.text,
    ...typography.small,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  row2: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  amountCard: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  amountLabel: {
    color: colors.text,
    ...typography.small,
    fontWeight: '600',
  },

  amountValue: {
    color: colors.brand,
    ...typography.h3,
    fontWeight: '800',
  },

  bottomCta: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
})
