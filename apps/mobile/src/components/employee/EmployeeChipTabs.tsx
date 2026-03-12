import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, overlays } from '../../theme/colors'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'
import { typography } from '../../theme/typography'

type EmployeeChipTabsProps<T extends string> = {
  options: Array<{ key: T; label: string }>
  value: T
  onChange: (next: T) => void
}

export function EmployeeChipTabs<T extends string>({
  options,
  value,
  onChange,
}: EmployeeChipTabsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.key === value

        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tab: {
    minWidth: 64,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  tabText: {
    color: colors.text,
    ...typography.small,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.brandForeground,
  },
})
