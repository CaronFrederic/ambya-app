import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { colors } from '../../theme/colors'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'
import { typography } from '../../theme/typography'

type EmployeeTimePickerProps = {
  value?: string
  onChange: (value: string) => void
}

export function EmployeeTimePicker({
  value,
  onChange,
}: EmployeeTimePickerProps) {
  const [selectedHour, selectedMinute] = useMemo(() => {
    const [hour = '09', minute = '00'] = (value ?? '09:00').split(':')
    return [hour, minute]
  }, [value])

  const hours = Array.from({ length: 24 }).map((_, index) =>
    String(index).padStart(2, '0'),
  )
  const minutes = Array.from({ length: 60 }).map((_, index) =>
    String(index).padStart(2, '0'),
  )

  return (
    <View style={styles.wrap}>
      <ScrollView style={styles.column} nestedScrollEnabled>
        {hours.map((hour) => {
          const active = hour === selectedHour
          return (
            <Pressable
              key={hour}
              onPress={() => onChange(`${hour}:${selectedMinute}`)}
              style={[styles.cell, active && styles.cellActive]}
            >
              <Text style={[styles.cellText, active && styles.cellTextActive]}>{hour}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView style={styles.column} nestedScrollEnabled>
        {minutes.map((minute) => {
          const active = minute === selectedMinute
          return (
            <Pressable
              key={minute}
              onPress={() => onChange(`${selectedHour}:${minute}`)}
              style={[styles.cell, active && styles.cellActive]}
            >
              <Text style={[styles.cellText, active && styles.cellTextActive]}>{minute}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 2,
    width: 120,
    height: 164,
    borderWidth: 1,
    borderColor: 'rgba(58,58,58,0.18)',
    backgroundColor: colors.card,
  },
  column: {
    flex: 1,
  },
  cell: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    backgroundColor: '#1877F2',
  },
  cellText: {
    color: colors.text,
    ...typography.body,
  },
  cellTextActive: {
    color: colors.brandForeground,
    fontWeight: '700',
  },
})
