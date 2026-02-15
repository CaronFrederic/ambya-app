import { Pressable, Text, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'

type Props = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary'
            ? styles.textPrimary
            : styles.textSecondary,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderRadius: radius.lg,
  minHeight: 48,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
},

  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  secondary: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },

  pressed: {
    opacity: 0.85,
  },

  disabled: {
    opacity: 0.45,
  },

  text: {
    fontSize: 16,
    fontWeight: '500', // 🎯 medium (aligné Figma)
  },

  textPrimary: {
    color: colors.primaryForeground,
  },

  textSecondary: {
    color: colors.text,
  },
})
