import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, overlays } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = {
  title: string
  salonName: string
  discountPercent: number
  highlightLabel?: string
  price: number
  originalPrice?: number
  onPress?: () => void
}

function formatFCFA(amount: number) {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

export function OfferListItem({
  title,
  salonName,
  discountPercent,
  highlightLabel,
  price,
  originalPrice,
  onPress,
}: Props) {
  const hasOriginal = typeof originalPrice === 'number' && originalPrice > price
  const badgeText =
    discountPercent > 0 ? `-${discountPercent}%` : (highlightLabel ?? 'Selection')

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumb}>
        <Text style={styles.thumbText}>{badgeText}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.salon} numberOfLines={1}>
          {salonName}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatFCFA(price)}</Text>
          {hasOriginal ? (
            <Text style={styles.originalPrice}>{formatFCFA(originalPrice!)}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {discountPercent > 0 ? `-${discountPercent}\n%` : badgeText}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(107,39,55,0.35)" />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,

    shadowColor: colors.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  thumb: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: overlays.premium20,
    borderWidth: 1,
    borderColor: overlays.brand20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },

  thumbText: {
    ...typography.small,
    fontWeight: '700',
    color: colors.brandForeground,
    textAlign: 'center',
  },

  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },

  salon: {
    ...typography.small,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  price: {
    ...typography.body,
    fontWeight: '800',
    color: colors.brand,
  },

  originalPrice: {
    ...typography.small,
    fontWeight: '500',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },

  right: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },

  badge: {
    minWidth: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.promo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
    color: colors.promoForeground,
  },
})
