// app/(tabs)/profile/notifications.tsx
import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'

import { Screen } from '../../../src/components/Screen'
import { colors, overlays } from '../../../src/theme/colors'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import { typography } from '../../../src/theme/typography'

import { useMeSummary, useUpdateMeProfile, MeSummary } from '../../../src/api/me'

type NotifValue = 'push' | 'email' | 'sms'

const OPTIONS: { label: string; value: NotifValue; icon: any; sub: string }[] = [
  { label: 'Push', value: 'push', icon: 'notifications-outline', sub: 'Notifications sur votre téléphone' },
  { label: 'Email', value: 'email', icon: 'mail-outline', sub: 'Recevoir un email' },
  { label: 'SMS', value: 'sms', icon: 'chatbubble-ellipses-outline', sub: 'Recevoir un SMS' },
]

export default function NotificationsScreen() {
  const qc = useQueryClient()
  const { data: summary, isLoading, isRefetching } = useMeSummary(true)
  const update = useUpdateMeProfile()

  const selected = useMemo(() => {
    const q = (summary?.profile?.questionnaire ?? {}) as any
    const prefs = (q?.practical?.notifPrefs ?? []) as string[]
    return new Set(prefs.filter((x) => x === 'push' || x === 'email' || x === 'sms') as NotifValue[])
  }, [summary])

  const saving = update.isPending

  const commit = async (next: Set<NotifValue>) => {
    const nextArr = Array.from(next)

    // ✅ Optimistic UI : on pousse directement dans la cache source-of-truth
    qc.setQueryData<MeSummary>(['me', 'summary'], (old) => {
      if (!old?.profile) return old as any

      const prevQ = (old.profile.questionnaire ?? {}) as any
      return {
        ...old,
        profile: {
          ...old.profile,
          questionnaire: {
            ...prevQ,
            practical: {
              ...(prevQ.practical ?? {}),
              notifPrefs: nextArr,
            },
          },
        },
      }
    })

    try {
      await update.mutateAsync({
        questionnaire: {
          practical: {
            notifPrefs: nextArr,
          },
        },
      })
      // update hook invalide déjà, mais on peut forcer si tu veux :
      // await qc.invalidateQueries({ queryKey: ['me', 'summary'] })
    } catch (e: any) {
      // rollback : refetch vérité serveur
      await qc.invalidateQueries({ queryKey: ['me', 'summary'] })
      Alert.alert('Erreur', e?.message ?? 'Impossible de mettre à jour les notifications.')
    }
  }

  const toggle = (v: NotifValue) => {
    if (saving || isLoading) return
    const next = new Set(selected)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    commit(next)
  }

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.hint}>Choisissez comment vous souhaitez être notifié.</Text>

          {(isLoading || isRefetching || saving) && (
            <View style={styles.savingRow}>
              <ActivityIndicator />
              <Text style={styles.savingText}>{saving ? 'Enregistrement…' : 'Chargement…'}</Text>
            </View>
          )}
        </View>

        <View style={{ gap: spacing.md }}>
          {OPTIONS.map((o) => {
            const on = selected.has(o.value)
            return (
              <Pressable
                key={o.value}
                onPress={() => toggle(o.value)}
                disabled={saving || isLoading}
                style={[
                  styles.row,
                  on ? styles.rowOn : styles.rowOff,
                  (saving || isLoading) && { opacity: 0.7 },
                ]}
              >
                <Ionicons name={o.icon} size={22} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{o.label}</Text>
                  <Text style={styles.rowSub}>{o.sub}</Text>
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
  topRow: { gap: 10 },
  hint: { color: colors.textMuted, ...typography.small },

  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savingText: { color: colors.textMuted, ...typography.small, fontWeight: '700' },

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
