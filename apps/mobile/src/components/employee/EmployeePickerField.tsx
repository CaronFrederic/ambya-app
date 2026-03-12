import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '../../theme/colors'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'
import { typography } from '../../theme/typography'

type EmployeePickerFieldProps = {
  label: string
  value?: string
  placeholder: string
  onPress: () => void
  error?: string
  icon?: keyof typeof Ionicons.glyphMap
}

export function EmployeePickerField({
  label,
  value,
  placeholder,
  onPress,
  error,
  icon = 'chevron-down',
}: EmployeePickerFieldProps) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[styles.field, error && styles.fieldError]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  )
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    ...typography.small,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  field: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: {
    borderColor: colors.dangerText,
  },
  value: {
    color: colors.text,
    ...typography.body,
  },
  placeholder: {
    color: colors.textMuted,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.dangerText,
    ...typography.small,
    fontWeight: '600',
  },
})
