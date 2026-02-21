import React from 'react'
import { Text, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = {
  discount: string
  service: string
  salon: string
  onPress?: () => void
  width?: number
}

export function OfferCard({ discount, service, salon, onPress, width = 240 }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.pressable, { width }]}>
      <LinearGradient
        colors={['#6B2737', '#8B3747']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <Text style={styles.discount}>{discount}</Text>
        <Text style={styles.service}>{service}</Text>
        <Text style={styles.salon}>{salon}</Text>
        <Text style={styles.cta}>Cliquez pour réserver →</Text>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  discount: {
    color: colors.brandForeground,
    ...typography.small,
    fontWeight: '600',
    marginBottom: spacing.xs,
    opacity: 0.95,
  },
  service: {
    color: colors.brandForeground,
    ...typography.h3,
    fontWeight: '700',
  },
  salon: {
    color: 'rgba(255,255,255,0.70)',
    ...typography.small,
    marginTop: spacing.xs,
  },
  cta: {
    color: 'rgba(255,255,255,0.80)',
    ...typography.small,
    marginTop: spacing.md,
    fontWeight: '500',
  },
})
