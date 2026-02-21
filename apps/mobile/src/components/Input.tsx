// src/components/Input.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string
  hint?: string
  error?: string
  left?: React.ReactNode
  right?: React.ReactNode
  containerStyle?: any
  inputStyle?: any
  variant?: 'default' | 'password'
}

export function Input({
  style, // backward compat
  inputStyle,
  containerStyle,
  label,
  hint,
  error,
  left,
  right,
  variant = 'default',
  secureTextEntry,
  ...props
}: Props) {
  const [show, setShow] = useState(false)

  const isPassword = variant === 'password' || !!secureTextEntry
  const actualSecure = isPassword ? !show : false

  const RightNode: React.ReactNode =
    right ??
    (isPassword ? (
      <Pressable onPress={() => setShow(s => !s)} hitSlop={10} style={styles.eyeBtn}>
        <Text style={styles.eyeText}>{show ? 'Masquer' : 'Afficher'}</Text>
      </Pressable>
    ) : null)

  const hasLeft = !!left
  const hasRight = !!RightNode

  return (
    <View style={containerStyle}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.wrap,
          error ? styles.wrapError : null,
          hasLeft ? styles.withLeft : null,
          hasRight ? styles.withRight : null,
        ]}
      >
        {hasLeft ? <View style={styles.left}>{left}</View> : null}

        <TextInput
          {...props}
          secureTextEntry={actualSecure}
          style={[styles.input, style, inputStyle]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.brand}
          autoCorrect={props.autoCorrect ?? false}
        />

        {hasRight ? <View style={styles.right}>{RightNode}</View> : null}
      </View>

      {!!error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        !!hint && <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    ...typography.small,
    fontWeight: '600', // override token weight only
    marginBottom: spacing.xs,
  },

  wrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  wrapError: {
    borderColor: colors.dangerText,
  },

  withLeft: {
    paddingLeft: spacing.sm,
  },

  withRight: {
    paddingRight: spacing.sm,
  },

  left: {
    marginRight: spacing.sm,
  },

  right: {
    marginLeft: spacing.sm,
  },

  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text,
    ...typography.body,
  },

  hintText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    ...typography.small,
  },

  errorText: {
    marginTop: spacing.xs,
    color: colors.dangerText,
    ...typography.small,
    fontWeight: '600',
  },

  eyeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },

  eyeText: {
    color: colors.brand,
    ...typography.small,
    fontWeight: '600',
  },
})
