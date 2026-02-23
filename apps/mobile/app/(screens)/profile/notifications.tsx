// app/(tabs)/profile/notifications.tsx
import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../../src/components/Screen'
import { useProfile } from '../../../src/providers/ProfileProvider'
import { colors, overlays } from '../../../src/theme/colors'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import { typography } from '../../../src/theme/typography'

const ALL = ['Push', 'Email'] as const
type Notif = (typeof ALL)[number]

export default function NotificationsScreen() {
  const { data, patchSection } = useProfile()

  const selected = useMemo(
    () => new Set((data.practical.notifications ?? []) as Notif[]),
    [data.practical.notifications]
  )

  const toggle = (n: Notif) => {
    const next = new Set(selected)
    if (next.has(n)) next.delete(n)
    else next.add(n)
    patchSection('practical', { notifications: Array.from(next) })
  }

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>Choisissez comment vous souhaitez être notifié.</Text>

        <View style={{ gap: spacing.md }}>
          {ALL.map((n) => {
            const on = selected.has(n)
            const icon = n === 'Push' ? 'notifications-outline' : 'mail-outline'
            return (
              <Pressable key={n} onPress={() => toggle(n)} style={[styles.row, on ? styles.rowOn : styles.rowOff]}>
                <Ionicons name={icon} size={22} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{n}</Text>
                  <Text style={styles.rowSub}>{n === 'Push' ? 'Notifications sur votre téléphone' : 'Recevoir un email'}</Text>
                </View>
                {on ? <Ionicons name="checkmark" size={20} color={colors.brand} /> : null}
              </Pressable>
            )
          })}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl + 10,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerBack: { position: 'absolute', left: spacing.lg, top: spacing.xl + 10, padding: 6 },
  headerTitle: { color: '#fff', ...typography.h2, marginTop: spacing.lg },

  content: { padding: spacing.lg, gap: spacing.lg },
  hint: { color: colors.textMuted, ...typography.small },

  row: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowOff: { borderWidth: 1, borderColor: overlays.brand20 },
  rowOn: { borderWidth: 2, borderColor: colors.brand, backgroundColor: overlays.brand05 },
  rowTitle: { color: colors.text, ...typography.body, fontWeight: '700' },
  rowSub: { color: colors.textMuted, ...typography.small, marginTop: 2 },
})
