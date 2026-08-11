import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Href } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { colors, overlays } from '../../theme/colors'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'
import { typography } from '../../theme/typography'
import { goBackOrReplace } from '../../navigation/back'

type EmployeeHeaderProps = {
  title: string
  subtitle?: string
  canGoBack?: boolean
  onBackPress?: () => void
  actionIcon?: keyof typeof Ionicons.glyphMap
  onActionPress?: () => void
  actionBadgeCount?: number
  topInset?: number
  fallbackHref?: Href
}

export function EmployeeHeader({
  title,
  subtitle,
  canGoBack = false,
  onBackPress,
  actionIcon,
  onActionPress,
  actionBadgeCount = 0,
  topInset = spacing.xl,
  fallbackHref = '/(employee)/dashboard',
}: EmployeeHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.row}>
        {canGoBack ? (
          <Pressable
            onPress={() => {
              if (onBackPress) {
                onBackPress()
                return
              }
              goBackOrReplace(fallbackHref)
            }}
            style={styles.iconButton}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color={colors.brandForeground} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        {actionIcon ? (
          <Pressable onPress={onActionPress} style={styles.iconButton} hitSlop={10}>
            <Ionicons name={actionIcon} size={18} color={colors.brandForeground} />
            {actionBadgeCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {actionBadgeCount > 9 ? '9+' : actionBadgeCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: overlays.white06,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.brandForeground,
    ...typography.caption,
    fontWeight: '800',
    fontSize: 10,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    color: colors.brandForeground,
    ...typography.h2,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.85)',
    ...typography.small,
    fontWeight: '500',
  },
})
