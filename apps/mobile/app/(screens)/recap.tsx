import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { useBooking } from '../../src/providers/BookingProvider'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

function formatFCFA(v: number) {
  return `${v.toLocaleString('fr-FR')} FCFA`
}

export default function RecapScreen() {
  const { draft } = useBooking()

  const { totalPrice, totalDuration } = useMemo(() => {
    const totalPrice = draft.cart.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    )
    const totalDuration = draft.cart.reduce(
      (sum, item) => sum + (item.duration || 30) * (item.quantity || 1),
      0
    )
    return { totalPrice, totalDuration }
  }, [draft.cart])

  return (
    <Screen noPadding style={styles.screen}>
      {/* Header bordeaux */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons
            name="arrow-back"
            size={22}
            color="#fff"
            onPress={() => router.back()}
          />
        </View>
        <Text style={styles.headerTitle}>Récap prestations</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Durée totale estimée</Text>
            <Text style={styles.summaryValue}>{totalDuration} min</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montant total</Text>
            <Text style={styles.summaryPrice}>{formatFCFA(totalPrice)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Services sélectionnés</Text>

        <View style={{ gap: spacing.md }}>
          {draft.cart.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTop}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                {!!item.quantity && item.quantity > 1 && (
                  <View style={styles.qtyPill}>
                    <Text style={styles.qtyText}>x{item.quantity}</Text>
                  </View>
                )}
              </View>

              <View style={styles.itemMetaRow}>
                <View style={styles.metaLeft}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.duration || 30} min</Text>
                </View>

                <Text style={styles.dot}>•</Text>

                <Text style={styles.itemPrice}>{formatFCFA(item.price)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <Button
          title="Modifier services"
          variant="outline"
          onPress={() => router.back()}
          style={{ flex: 1 }}
        />
        <Button
          title="Choisir un créneau"
          onPress={() => router.push('/(screens)/schedule')}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
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
    paddingBottom: 140,
  },

  summaryCard: {
    backgroundColor: overlays.brand05,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: { color: colors.textMuted, ...typography.small },
  summaryValue: { color: colors.brand, ...typography.body, fontWeight: '600' },
  summaryPrice: { color: colors.brand, ...typography.h3 },

  sectionTitle: {
    color: colors.text,
    ...typography.h3,
    marginBottom: spacing.md,
  },

  itemCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemName: { flex: 1, color: colors.text, ...typography.body, fontWeight: '600' },
  qtyPill: {
    backgroundColor: overlays.brand10,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  qtyText: { color: colors.brand, ...typography.small, fontWeight: '600' },

  itemMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { color: colors.textMuted, ...typography.small },
  dot: { color: colors.textMuted, marginHorizontal: spacing.sm },
  itemPrice: { color: colors.brand, ...typography.body, fontWeight: '700' },

  bottomBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
})
