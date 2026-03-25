import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Card } from './Card'
import { colors, overlays } from '../theme/colors'
import { radius } from '../theme/radius'
import { spacing } from '../theme/spacing'
import { typography } from '../theme/typography'

type Props = {
  title: string
  description?: string
  icon?: keyof typeof Ionicons.glyphMap
  actionLabel?: string
  onAction?: () => void
}

export function FeedbackState({
  title,
  description,
  icon = 'information-circle-outline',
  actionLabel,
  onAction,
}: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={colors.brand} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlays.brand05,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.medium,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.md,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlays.brand20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF8F5',
  },
  buttonText: {
    color: colors.brand,
    ...typography.body,
    fontWeight: '700',
  },
})
