import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, overlays } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = {
  title: string
  salonName: string
  salonImageUrl?: string | null
  discountPercent: number
  highlightLabel?: string
  price: number
  originalPrice?: number
  onPress?: () => void
}

function formatFCFA(amount?: number | null) {
  const safeAmount = Number(amount)

  if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
    return 'Prix à confirmer'
  }

  return `${safeAmount.toLocaleString('fr-FR')} FCFA`
}

export function OfferListItem({
  title,
  salonName,
  salonImageUrl,
  discountPercent,
  highlightLabel,
  price,
  originalPrice,
  onPress,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  const safePrice = Number(price)
  const safeOriginalPrice = Number(originalPrice)
  const hasOriginal =
    Number.isFinite(safePrice) &&
    Number.isFinite(safeOriginalPrice) &&
    safeOriginalPrice > safePrice
  const badgeText =
    discountPercent > 0 ? `-${discountPercent}%` : (highlightLabel ?? 'Selection')
  const showImage = Boolean(salonImageUrl && !imageFailed)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} chez ${salonName}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.thumb}>
        {showImage ? (
          <Image
            source={{ uri: salonImageUrl! }}
            style={styles.thumbImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={styles.thumbText}>{badgeText}</Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <Text style={styles.salon} numberOfLines={1}>
          {salonName}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatFCFA(price)}</Text>
          {hasOriginal ? (
            <Text style={styles.originalPrice}>{formatFCFA(originalPrice)}</Text>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {discountPercent > 0 ? `-${discountPercent}%` : badgeText}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(107,39,55,0.35)" />
        </View>
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
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,

    shadowColor: colors.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  thumb: {
    width: 74,
    minHeight: 74,
    borderRadius: radius.lg,
    backgroundColor: overlays.premium20,
    borderWidth: 1,
    borderColor: overlays.brand20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    flexShrink: 0,
    overflow: 'hidden',
  },

  thumbImage: {
    width: '100%',
    height: '100%',
    minHeight: 74,
    borderRadius: radius.lg,
  },

  thumbText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brandForeground,
    textAlign: 'center',
    lineHeight: 14,
  },

  content: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },

  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 21,
    flexShrink: 1,
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
    flexWrap: 'wrap',
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

  metaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  badge: {
    maxWidth: '86%',
    minHeight: 34,
    borderRadius: radius.full,
    backgroundColor: colors.promo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexShrink: 1,
  },

  badgeText: {
    ...typography.caption,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
    color: colors.promoForeground,
  },
})
