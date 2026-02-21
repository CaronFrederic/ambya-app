import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { typography } from '../theme/typography'

type Props = {
  title: string
  style?: any
}

export function SectionTitle({ title, style }: Props) {
  return <Text style={[styles.title, style]}>{title}</Text>
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.h3,
    marginBottom: spacing.md,
  },
})
