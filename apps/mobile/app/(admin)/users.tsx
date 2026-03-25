import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'

import { useAdminUsers } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle } from '../../src/components/AdminScaffold'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

export default function AdminUsersScreen() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<string | undefined>(undefined)
  const { data, isLoading, isError, refetch } = useAdminUsers({
    q: q || undefined,
    role,
  })

  const roles = [
    ['Tous', undefined],
    ['Clients', 'CLIENT'],
    ['Pros', 'PROFESSIONAL'],
    ['Employes', 'EMPLOYEE'],
  ] as const

  return (
    <Screen noPadding>
      <AdminHeader title="Utilisateurs" subtitle="Support client, pro et employee" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          value={q}
          onChangeText={setQ}
          placeholder="Rechercher un email, nom, salon..."
          containerStyle={styles.inputWrap}
        />

        <View style={styles.filterRow}>
          {roles.map(([label, value]) => {
            const active = role === value
            return (
              <Pressable
                key={label}
                onPress={() => setRole(value)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>

        <AdminSectionTitle title={`Resultats (${data?.total ?? 0})`} />
        {isLoading ? (
          <FeedbackState title="Chargement des utilisateurs" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError ? (
          <FeedbackState
            title="Impossible de charger les utilisateurs"
            description="Reessaie dans un instant."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : !data || data.items.length === 0 ? (
          <FeedbackState
            title="Aucun utilisateur trouve"
            description="Aucun resultat ne correspond a la recherche actuelle."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : (
          <View style={styles.list}>
            {data.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname:
                      item.role === 'CLIENT'
                        ? '/(admin)/client-detail'
                        : item.role === 'EMPLOYEE'
                          ? '/(admin)/employee-detail'
                          : '/(admin)/user-detail',
                    params: { id: item.id },
                  } as never)
                }
              >
                <Card style={styles.card}>
                  <Text style={styles.title}>{item.displayName}</Text>
                  <Text style={styles.meta}>{formatRoleLabel(item.role)}</Text>
                  <Text style={styles.meta}>{item.email ?? item.phone ?? 'Aucune coordonnee'}</Text>
                  {item.salonName ? <Text style={styles.meta}>{item.salonName}</Text> : null}
                  <Text style={[styles.badge, !item.isActive && styles.badgeOff]}>
                    {item.isActive ? 'Actif' : 'Inactif'}
                  </Text>
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
  inputWrap: {
    marginBottom: spacing.xs,
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
    backgroundColor: '#E7F6EC',
    color: '#1F7A3A',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeOff: {
    backgroundColor: '#FCE7EC',
    color: colors.danger,
  },
})

function formatRoleLabel(role?: string | null) {
  switch (role) {
    case 'CLIENT':
      return 'Client'
    case 'EMPLOYEE':
      return 'Employe'
    case 'PROFESSIONAL':
      return 'Professionnel'
    case 'ADMIN':
      return 'Admin'
    default:
      return role ?? 'Utilisateur'
  }
}
