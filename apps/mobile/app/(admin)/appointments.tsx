import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'

import { useAdminAppointments } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle } from '../../src/components/AdminScaffold'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

export default function AdminAppointmentsScreen() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const { data, isLoading, isError, refetch } = useAdminAppointments({
    q: q || undefined,
    status,
  })

  const statuses = [
    ['Tous', undefined],
    ['En attente', 'PENDING'],
    ['Confirmes', 'CONFIRMED'],
    ['Termines', 'COMPLETED'],
    ['Annules', 'CANCELLED'],
  ] as const

  return (
    <Screen noPadding>
      <AdminHeader title="Rendez-vous" subtitle="Support, consultation et correction" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input value={q} onChangeText={setQ} placeholder="Rechercher salon, service ou client..." />
        <View style={styles.filterRow}>
          {statuses.map(([label, value]) => {
            const active = status === value
            return (
              <Pressable
                key={label}
                onPress={() => setStatus(value)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
        <AdminSectionTitle title={`Resultats (${data?.total ?? 0})`} />
        {isLoading ? (
          <FeedbackState title="Chargement des rendez-vous" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError ? (
          <FeedbackState
            title="Impossible de charger les rendez-vous"
            description="Reessaie dans un instant."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : !data || data.items.length === 0 ? (
          <FeedbackState
            title="Aucun rendez-vous trouve"
            description="Aucun rendez-vous ne correspond a la recherche actuelle."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : (
          <View style={styles.list}>
            {data.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/(admin)/appointment-detail' as never, params: { id: item.id } })}
              >
                <Card style={styles.card}>
                  <Text style={styles.title}>{item.client.name}</Text>
                  <Text style={styles.meta}>{item.service.name}</Text>
                  <Text style={styles.meta}>{item.salon.name}</Text>
                  <Text style={styles.meta}>{new Date(item.startAt).toLocaleString('fr-FR')}</Text>
                  <Text style={[styles.badge, getStatusBadgeStyle(item.status)]}>{formatStatusLabel(item.status)}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.brandForeground,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: '#FBF3F5',
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
  },
})

function formatStatusLabel(status?: string | null) {
  switch (status) {
    case 'PENDING':
      return 'En attente'
    case 'CONFIRMED':
      return 'Confirme'
    case 'COMPLETED':
      return 'Termine'
    case 'CANCELLED':
      return 'Annule'
    case 'NO_SHOW':
      return 'No-show'
    default:
      return status ?? 'Inconnu'
  }
}

function getStatusBadgeStyle(status?: string | null) {
  switch (status) {
    case 'COMPLETED':
      return {
        backgroundColor: '#E7F6EC',
        color: '#1F7A3A',
      }
    case 'CANCELLED':
    case 'NO_SHOW':
      return {
        backgroundColor: '#FCE7EC',
        color: colors.danger,
      }
    default:
      return {
        backgroundColor: '#FBF3F5',
        color: colors.brand,
      }
  }
}
