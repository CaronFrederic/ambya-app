import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, type Href } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'

import { FeedbackState } from '../src/components/FeedbackState'
import { Screen } from '../src/components/Screen'
import {
  type AppNotification,
  useMarkNotificationRead,
  useNotifications,
} from '../src/api/notifications'
import { colors, overlays } from '../src/theme/colors'
import { radius } from '../src/theme/radius'
import { spacing } from '../src/theme/spacing'
import { typography } from '../src/theme/typography'

export default function NotificationsScreen() {
  const queryClient = useQueryClient()
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()

  const openNotification = async (item: AppNotification) => {
    if (!item.readAt) {
      await markRead.mutateAsync(item.id)
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['employee', 'dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['employee', 'schedule'] }),
      queryClient.invalidateQueries({ queryKey: ['pro', 'appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])

    if (item.targetRoute) {
      router.push(item.targetRoute as Href)
    }
  }

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Vos alertes importantes restent disponibles ici.</Text>
      </View>

      {notifications.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.centerText}>Chargement des notifications...</Text>
        </View>
      ) : notifications.isError ? (
        <View style={styles.center}>
          <FeedbackState
            icon="alert-circle-outline"
            title="Notifications indisponibles"
            description="Impossible de récupérer vos notifications pour le moment."
            actionLabel="Réessayer"
            onAction={() => void notifications.refetch()}
          />
        </View>
      ) : notifications.data?.items.length ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {notifications.data.unreadCount} notification
              {notifications.data.unreadCount > 1 ? 's' : ''} non lue
              {notifications.data.unreadCount > 1 ? 's' : ''}
            </Text>
          </View>

          {notifications.data.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => void openNotification(item)}
              style={({ pressed }) => [
                styles.card,
                !item.readAt && styles.unreadCard,
                pressed && styles.pressedCard,
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar-outline" size={18} color={colors.brand} />
                </View>

                <View style={styles.cardCopy}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!item.readAt ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.cardDate}>{formatNotificationDate(item.createdAt)}</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>

              <Text style={styles.message}>{item.message}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <FeedbackState
            icon="notifications-outline"
            title="Aucune notification"
            description="Les nouveaux rendez-vous et alertes importantes apparaitront ici."
          />
        </View>
      )}
    </Screen>
  )
}

function formatNotificationDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: overlays.white06,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.brandForeground,
    ...typography.h2,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.84)',
    ...typography.body,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  centerText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    ...typography.body,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    borderRadius: radius.full,
    backgroundColor: overlays.brand10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  summaryText: {
    color: colors.brand,
    ...typography.small,
    fontWeight: '800',
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  unreadCard: {
    borderColor: overlays.brand20,
    backgroundColor: '#FFF8F8',
  },
  pressedCard: {
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: overlays.brand10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    ...typography.medium,
    fontWeight: '800',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    flexShrink: 0,
  },
  cardDate: {
    marginTop: 2,
    color: colors.textMuted,
    ...typography.caption,
  },
  message: {
    marginTop: spacing.md,
    color: colors.text,
    ...typography.body,
    lineHeight: 22,
  },
})
