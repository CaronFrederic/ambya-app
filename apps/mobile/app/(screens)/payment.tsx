import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { useBooking } from '../../src/providers/BookingProvider'
import { createAppointmentsFromCart } from '../../src/api/appointments'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

function formatFCFA(v: number) {
  return `${v.toLocaleString('fr-FR')} FCFA`
}

export default function PaymentScreen() {
  const { draft } = useBooking()
  const qc = useQueryClient()

  const [method, setMethod] = useState<'card' | 'mobile_money' | 'cash'>(draft.paymentMethod ?? 'card')

  const totalAmount = useMemo(
    () => draft.cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
    [draft.cart],
  )

  const startAtIso = useMemo(() => {
    if (!draft.selectedDateIso || !draft.time) return null
    return `${draft.selectedDateIso}T${draft.time}:00.000Z`
  }, [draft.selectedDateIso, draft.time])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!draft.salonId) throw new Error('Salon non sélectionné')
      if (!startAtIso) throw new Error('Créneau non sélectionné')

      return createAppointmentsFromCart({
        salonId: draft.salonId,
        startAt: startAtIso,
        employeeId: draft.selectedEmployeeId,
        items: draft.cart.map((item) => ({ serviceId: item.id, quantity: item.quantity || 1 })),
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] })
      router.replace('/(screens)/booking-success')
    },
    onError: (error: any) => {
      Alert.alert('Impossible de réserver', error?.message ?? 'Erreur inconnue')
    },
  })

  const onConfirm = () => {
    if (method === 'card') {
      router.push({ pathname: '/(screens)/card-payment-details', params: { amount: String(totalAmount) } })
      return
    }
    mutation.mutate()
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
        <Text style={styles.blockTitle}>Choisissez votre mode de paiement</Text>

        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <MethodRow icon="card-outline" title="Carte bancaire" subtitle="Visa, Mastercard" active={method === 'card'} onPress={() => setMethod('card')} />
          <MethodRow icon="phone-portrait-outline" title="Mobile Money" subtitle="Paiement via opérateur" active={method === 'mobile_money'} onPress={() => setMethod('mobile_money')} />
          <MethodRow icon="cash-outline" title="Payer sur place" subtitle="En espèces au salon" active={method === 'cash'} onPress={() => setMethod('cash')} />
        </View>

        <View style={styles.recapBox}>
          <Text style={styles.recapTitle}>Récapitulatif</Text>
          {draft.cart.map((it) => (
            <View key={it.id} style={styles.recapRow}>
              <Text style={styles.recapLabel} numberOfLines={1}>{it.name} x{it.quantity || 1}</Text>
              <Text style={styles.recapLabel}>{formatFCFA(it.price * (it.quantity || 1))}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.recapRow}>
            <Text style={styles.recapStrong}>Montant total</Text>
            <Text style={styles.recapPrice}>{formatFCFA(totalAmount)}</Text>
          </View>
          <Text style={styles.recapSub}>Créneau: {draft.selectedDateIso} {draft.time ?? '-'}</Text>
          <Text style={styles.recapSub}>Salon: {draft.salonName ?? '-'}</Text>
        </View>

        <View style={{ height: 24 }} />

        <Button
          title={method === 'card' ? 'Continuer vers carte' : 'Confirmer la réservation'}
          onPress={onConfirm}
          disabled={mutation.isPending || !draft.salonId || !startAtIso || draft.cart.length === 0}
        />
      </ScrollView>
    </Screen>
  )
}

function MethodRow({ icon, title, subtitle, active, onPress }: { icon: any; title: string; subtitle: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.cardBox, active ? styles.activeBorder : styles.idleBorder]}>
      <View style={styles.methodTop}>
        <Ionicons name={icon} size={22} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>{title}</Text>
          <Text style={styles.methodSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  header: { backgroundColor: colors.brand, paddingTop: spacing.xl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerRow: { marginBottom: spacing.md },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },
  content: { padding: spacing.lg },
  blockTitle: { color: colors.text, ...typography.body, fontWeight: '600', marginBottom: spacing.md },
  cardBox: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md },
  methodTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodTitle: { color: colors.text, ...typography.body, fontWeight: '600' },
  methodSubtitle: { color: colors.textMuted, ...typography.small, marginTop: 2 },
  idleBorder: { borderWidth: 1, borderColor: overlays.brand20 },
  activeBorder: { borderWidth: 2, borderColor: colors.brand, backgroundColor: overlays.brand05 },
  recapBox: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: overlays.brand20 },
  recapTitle: { color: colors.text, ...typography.body, fontWeight: '700', marginBottom: spacing.md },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  recapLabel: { color: colors.textMuted, ...typography.small, flex: 1 },
  recapStrong: { color: colors.text, ...typography.body, fontWeight: '700' },
  recapPrice: { color: colors.brand, ...typography.h3 },
  recapSub: { color: colors.textMuted, ...typography.small },
  divider: { height: 1, backgroundColor: overlays.brand10, marginVertical: spacing.md },
})
