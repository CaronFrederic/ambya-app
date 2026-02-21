import React from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { colors, overlays } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
  textStyle,
}: Props) {
  const containerStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
        ? styles.secondary
        : styles.outline

  const labelStyle =
    variant === 'primary'
      ? styles.textPrimary
      : variant === 'secondary'
        ? styles.textSecondary
        : styles.textOutline

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        pressed && !disabled && { opacity: 0.9 },
        disabled && styles.disabled,
        style, // ✅ style externe
      ]}
    >
      <Text style={[styles.text, labelStyle, textStyle]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  primary: {
    backgroundColor: colors.brand,
  },

  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  outline: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: overlays.brand20,
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    ...typography.body,
    fontWeight: '700',
  },

  textPrimary: {
    color: colors.brandForeground,
  },

  textSecondary: {
    color: colors.text,
  },

  textOutline: {
    color: colors.brand,
  },
})
