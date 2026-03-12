import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors, overlays } from '../../theme/colors'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'
import { typography } from '../../theme/typography'

const WEEK_DAYS = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']
const MONTH_NAMES = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
]

type EmployeeCalendarPickerProps = {
  value?: string
  onChange: (value: string) => void
  onClear?: () => void
}

export function EmployeeCalendarPicker({
  value,
  onChange,
  onClear,
}: EmployeeCalendarPickerProps) {
  const selectedDate = useMemo(() => parseDate(value), [value])
  const [cursor, setCursor] = useState(
    selectedDate ?? new Date(2026, 2, 1),
  )

  const monthLabel = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
  const days = useMemo(() => getCalendarDays(cursor), [cursor])

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setCursor(addMonths(cursor, -1))} hitSlop={8}>
            <Ionicons name="chevron-up" size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => setCursor(addMonths(cursor, 1))} hitSlop={8}>
            <Ionicons name="chevron-down" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === cursor.getMonth()
          const isSelected = sameDay(day, selectedDate)

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onChange(formatDate(day))}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
            >
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonth && styles.dayTextMuted,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={styles.footerAction}>Effacer</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const today = new Date()
            setCursor(today)
            onChange(formatDate(today))
          }}
          hitSlop={8}
        >
          <Text style={styles.footerAction}>Aujourd'hui</Text>
        </Pressable>
      </View>
    </View>
  )
}

function getCalendarDays(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstWeekday)

  return Array.from({ length: 42 }).map((_, index) => {
    const next = new Date(gridStart)
    next.setDate(gridStart.getDate() + index)
    return next
  })
}

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function parseDate(value?: string) {
  if (!value) return null
  const parts = value.split('/').map(Number)
  if (parts.length !== 3) return null
  return new Date(parts[2], parts[1] - 1, parts[0])
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function sameDay(left: Date, right: Date | null) {
  if (!right) return false
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(58,58,58,0.18)',
    backgroundColor: colors.card,
    padding: spacing.sm,
    width: 188,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthLabel: {
    color: colors.text,
    ...typography.small,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    width: 24,
    textAlign: 'center',
    color: colors.text,
    ...typography.caption,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  dayCell: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  dayCellSelected: {
    backgroundColor: '#1877F2',
  },
  dayText: {
    color: colors.text,
    fontSize: 12,
  },
  dayTextMuted: {
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.brandForeground,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  footerAction: {
    color: '#1877F2',
    ...typography.caption,
  },
})
