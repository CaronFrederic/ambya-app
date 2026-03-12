import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

type EmployeeSelectListProps = {
  options: string[]
  value?: string
  placeholder?: string
  onSelect: (value: string) => void
}

export function EmployeeSelectList({
  options,
  value,
  placeholder = 'Selectionner un service',
  onSelect,
}: EmployeeSelectListProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.selectedRow}>
        <Text style={styles.selectedText}>{value || placeholder}</Text>
      </View>

      {options.map((option, index) => {
        const active = option === value
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.option, active && styles.optionActive, index === 0 && styles.firstOption]}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: 'rgba(58,58,58,0.18)',
    backgroundColor: colors.card,
  },
  selectedRow: {
    display: 'none',
  },
  firstOption: {
    borderTopWidth: 0,
  },
  option: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(58,58,58,0.10)',
  },
  optionActive: {
    backgroundColor: '#1877F2',
  },
  optionText: {
    color: colors.text,
    ...typography.body,
  },
  optionTextActive: {
    color: colors.brandForeground,
    fontWeight: '700',
  },
  selectedText: {
    color: colors.text,
  },
})
