// app/(screens)/payment.tsx
import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
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

export default function PaymentScreen() {
  const { draft, patch } = useBooking()

  const depositEnabled = draft.depositEnabled ?? true
  const depositPercentage = draft.depositPercentage ?? 30

  const totalAmount = useMemo(() => {
    return draft.cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
  }, [draft.cart])

  const [paymentChoice, setPaymentChoice] = useState<'full' | 'deposit'>(draft.paymentChoice ?? 'full')
  const [operator, setOperator] = useState(draft.operator ?? '')
  const [method, setMethod] = useState<'card' | 'mobile_money' | 'cash'>(draft.paymentMethod ?? 'card')

  const depositAmount = Math.round((totalAmount * depositPercentage) / 100)
  const remainingAmount = totalAmount - depositAmount

  const payNowAmount = depositEnabled && paymentChoice === 'deposit' ? depositAmount : totalAmount

  const onSelectChoice = (c: 'full' | 'deposit') => {
    setPaymentChoice(c)
    patch({ paymentChoice: c })
  }

  const onSelectMethod = (m: 'card' | 'mobile_money' | 'cash') => {
    setMethod(m)
    patch({ paymentMethod: m })
  }

  const onChangeOperator = (v: string) => {
    setOperator(v)
    patch({ operator: v })
  }

  const onPressCard = () => {
    onSelectMethod('card')

    router.push({
      pathname: '/(screens)/card-payment-details',
      params: { amount: String(payNowAmount) },
    })
  }

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={22} color="#fff" onPress={() => router.back()} />
        </View>
        <Text style={styles.headerTitle}>Mode de paiement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {depositEnabled && (
          <>
            <Text style={styles.blockTitle}>Montant à payer</Text>

            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              <ChoiceCard
                active={paymentChoice === 'full'}
                title="Payer la totalité"
                subtitle={formatFCFA(totalAmount)}
                onPress={() => onSelectChoice('full')}
              />

              <ChoiceCard
                active={paymentChoice === 'deposit'}
                title={`Payer un acompte (${depositPercentage}%)`}
                subtitle={`${formatFCFA(depositAmount)} maintenant`}
                onPress={() => onSelectChoice('deposit')}
              />
            </View>
          </>
        )}

        <Text style={styles.blockTitle}>
          {depositEnabled ? 'Mode de paiement' : 'Choisissez votre mode de paiement'}
        </Text>

        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <MethodRow
            icon="card-outline"
            title="Carte bancaire"
            subtitle="Visa, Mastercard"
            active={method === 'card'}
            onPress={onPressCard}
          />

          <View style={[styles.cardBox, method === 'mobile_money' ? styles.activeBorder : styles.idleBorder]}>
            <Pressable onPress={() => onSelectMethod('mobile_money')} style={styles.methodTop}>
              <Ionicons name="phone-portrait-outline" size={22} color={colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Mobile Money</Text>
                <Text style={styles.methodSubtitle}>Sélectionnez votre opérateur</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
            </Pressable>

            {method === 'mobile_money' && (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                <View style={styles.operatorRow}>
                  {['Airtel Money', 'Mobicash', 'Moov Money'].map((op) => {
                    const active = operator === op
                    return (
                      <Pressable
                        key={op}
                        onPress={() => onChangeOperator(op)}
                        style={[styles.operatorPill, active ? styles.operatorActive : styles.operatorIdle]}
                      >
                        <Text style={[styles.operatorText, active && { color: colors.brandForeground }]}>
                          {op}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>

                {!!operator && (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintTitle}>Instructions :</Text>
                    <Text style={styles.hintText}>
                      {operator === 'Airtel Money' && 'Composez *123# puis suivez les instructions.'}
                      {operator === 'Mobicash' && 'Composez *889# puis suivez les instructions.'}
                      {operator === 'Moov Money' && 'Composez *555# puis suivez les instructions.'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {!depositEnabled && (
            <MethodRow
              icon="cash-outline"
              title="Payer sur place"
              subtitle="En espèces au salon"
              active={method === 'cash'}
              onPress={() => onSelectMethod('cash')}
            />
          )}
        </View>

        <View style={styles.recapBox}>
          <Text style={styles.recapTitle}>Récapitulatif</Text>

          {draft.cart.slice(0, 2).map((it) => (
            <View key={it.id} style={styles.recapRow}>
              <Text style={styles.recapLabel} numberOfLines={1}>
                {it.name}
              </Text>
              <Text style={styles.recapLabel}>{formatFCFA(it.price)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.recapRow}>
            <Text style={styles.recapStrong}>Montant total</Text>
            <Text style={styles.recapPrice}>{formatFCFA(totalAmount)}</Text>
          </View>

          {depositEnabled && paymentChoice === 'deposit' && (
            <>
              <View style={styles.recapRow}>
                <Text style={styles.recapSub}>Acompte payé</Text>
                <Text style={styles.recapSubStrong}>{formatFCFA(depositAmount)}</Text>
              </View>
              <View style={styles.recapRow}>
                <Text style={styles.recapSub}>Reste à régler</Text>
                <Text style={styles.recapSub}>{formatFCFA(remainingAmount)}</Text>
              </View>
            </>
          )}

          {depositEnabled && paymentChoice === 'full' && (
            <View style={styles.recapRow}>
              <Text style={styles.recapSub}>Paiement intégral</Text>
              <Text style={[styles.recapSubStrong, { color: '#0F9D58' }]}>✓</Text>
            </View>
          )}

          {!depositEnabled && (
            <View style={styles.recapRow}>
              <Text style={styles.recapSub}>Paiement sur place</Text>
              <Text style={styles.recapSub}>Au salon</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

function ChoiceCard({
  active,
  title,
  subtitle,
  onPress,
}: {
  active: boolean
  title: string
  subtitle: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceCard, active ? styles.activeBorder : styles.idleBorder]}>
      <View style={styles.choiceRow}>
        <View style={[styles.radio, active ? styles.radioActive : styles.radioIdle]}>{active && <View style={styles.radioDot} />}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.choiceTitle}>{title}</Text>
          <Text style={styles.choiceSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  )
}

function MethodRow({
  icon,
  title,
  subtitle,
  active,
  onPress,
}: {
  icon: any
  title: string
  subtitle: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.cardBox, active ? styles.activeBorder : styles.idleBorder]}>
      <View style={styles.methodTop}>
        <Ionicons name={icon} size={22} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>{title}</Text>
          <Text style={styles.methodSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },

  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { marginBottom: spacing.md },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },

  content: {
    padding: spacing.lg,
    paddingBottom: 60,
  },

  blockTitle: { color: colors.text, ...typography.body, fontWeight: '600', marginBottom: spacing.md },

  choiceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ⚠️ overlays.brand30 n'existe pas chez toi -> on utilise brand20
  radioIdle: { borderColor: overlays.brand30 },
  radioActive: { borderColor: colors.brand },
  radioDot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.brand },

  choiceTitle: { color: colors.text, ...typography.body, fontWeight: '600' },
  choiceSubtitle: { color: colors.textMuted, ...typography.small, marginTop: 2 },

  cardBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  methodTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  methodTitle: { color: colors.text, ...typography.body, fontWeight: '600' },
  methodSubtitle: { color: colors.textMuted, ...typography.small, marginTop: 2 },

  idleBorder: { borderWidth: 1, borderColor: overlays.brand20 },
  // ⚠️ overlays.brand05 n'existe pas -> on met une surface douce
  activeBorder: { borderWidth: 2, borderColor: colors.brand, backgroundColor: overlays.brand05 },

  operatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  operatorPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.xl,
  },
  operatorIdle: { backgroundColor: colors.background, borderWidth: 1, borderColor: overlays.brand20 },
  operatorActive: { backgroundColor: colors.brand, borderWidth: 1, borderColor: colors.brand },
  operatorText: { color: colors.text, ...typography.small, fontWeight: '600' },

  hintBox: {
    // overlays.premium10 doit exister (tu l'as demandé)
    backgroundColor: overlays.premium10,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: overlays.premium20,
  },
  hintTitle: { color: colors.text, ...typography.small, fontWeight: '700', marginBottom: 4 },
  hintText: { color: colors.textMuted, ...typography.small },

  recapBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  recapTitle: { color: colors.text, ...typography.body, fontWeight: '700', marginBottom: spacing.md },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  recapLabel: { color: colors.textMuted, ...typography.small, flex: 1 },
  recapStrong: { color: colors.text, ...typography.body, fontWeight: '700' },
  recapPrice: { color: colors.brand, ...typography.h3 },

  recapSub: { color: colors.textMuted, ...typography.small },
  recapSubStrong: { color: colors.brand, ...typography.small, fontWeight: '700' },

  // ⚠️ overlays.brand10 n'existe pas -> hairline
  divider: { height: 1, backgroundColor: overlays.brand10, marginVertical: spacing.md },
})
