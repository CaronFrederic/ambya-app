import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = {
  name: string
  stars: number // 0..5
  text: string
}

export function ReviewCard({ name, stars, text }: Props) {
  const safeStars = Math.max(0, Math.min(5, stars))

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <LinearGradient
          colors={[colors.brand, colors.premium]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        />

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < safeStars ? 'star' : 'star-outline'}
                size={12}
                color={colors.premium}
              />
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  top: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
  },
  name: {
    color: colors.text,
    ...typography.small,
    fontWeight: '700',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  text: {
    color: 'rgba(58,58,58,0.80)',
    ...typography.body,
    lineHeight: 20,
  },
})
