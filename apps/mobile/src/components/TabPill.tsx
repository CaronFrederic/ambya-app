import React from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import { colors, overlays } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = {
  label: string
  active?: boolean
  onPress?: () => void
  style?: any
}

export function TabPill({ label, active, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        active ? styles.on : styles.off,
        style,
      ]}
    >
      <Text style={[styles.text, active ? styles.textOn : styles.textOff]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  on: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  off: {
    backgroundColor: colors.background,
    borderColor: overlays.brand20,
  },
  text: {
    ...typography.small,
    fontWeight: '600',
  },
  textOn: {
    color: colors.brandForeground,
  },
  textOff: {
    color: colors.text,
  },
})
