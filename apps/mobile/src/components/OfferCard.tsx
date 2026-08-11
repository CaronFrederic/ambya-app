import React, { useState } from 'react'
import { ImageBackground, Text, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = {
  badgeLabel: string
  service: string
  salon: string
  salonImageUrl?: string | null
  onPress?: () => void
  width?: number
}

export function OfferCard({
  badgeLabel,
  service,
  salon,
  salonImageUrl,
  onPress,
  width = 240,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(salonImageUrl && !imageFailed)
  const content = (
    <LinearGradient
      colors={showImage ? ['rgba(38,15,22,0.72)', 'rgba(107,39,55,0.78)'] : ['#6B2737', '#8B3747']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.card}
    >
      <Text style={styles.badgeLabel}>{badgeLabel}</Text>
      <Text style={styles.service}>{service}</Text>
      <Text style={styles.salon}>{salon}</Text>
      <Text style={styles.cta}>Cliquez pour reserver -&gt;</Text>
    </LinearGradient>
  )

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${service} chez ${salon}`}
      onPress={onPress}
      style={[styles.pressable, { width }]}
    >
      {showImage ? (
        <ImageBackground
          source={{ uri: salonImageUrl! }}
          style={styles.imageBackground}
          imageStyle={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
          accessibilityIgnoresInvertColors
        >
          {content}
        </ImageBackground>
      ) : (
        content
      )}
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
  imageBackground: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  image: {
    borderRadius: radius.xl,
  },
  badgeLabel: {
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
