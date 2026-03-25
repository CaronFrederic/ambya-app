import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { colors, overlays } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'
import { typography } from '../theme/typography'

export function AdminHeader({
  title,
  subtitle,
  back,
  rightLabel,
  onRightPress,
}: {
  title: string
  subtitle?: string
  back?: boolean
  rightLabel?: string
  onRightPress?: () => void
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {back ? (
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color={colors.brandForeground} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}

        {rightLabel && onRightPress ? (
          <Pressable onPress={onRightPress} style={styles.headerAction}>
            <Text style={styles.headerActionText}>{rightLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

export function AdminSectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function AdminStatCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlays.white10,
  },
  iconSpacer: {
    width: 40,
    height: 40,
  },
  headerAction: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlays.white10,
  },
  headerActionText: {
    color: colors.brandForeground,
    ...typography.small,
    fontWeight: '700',
  },
  title: {
    marginTop: spacing.lg,
    color: colors.brandForeground,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.82)',
    ...typography.body,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionAction: {
    color: colors.brand,
    ...typography.small,
    fontWeight: '700',
  },
  statCard: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  statValue: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    ...typography.small,
    fontWeight: '600',
  },
})
