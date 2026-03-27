import React, { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'

import { useAdmins, useCreateAdmin } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle } from '../../src/components/AdminScaffold'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { requireOnlineAction } from '../../src/offline/guard'
import { useOfflineStatus } from '../../src/providers/OfflineProvider'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

export default function AdminAdminsScreen() {
  const { isOffline } = useOfflineStatus()
  const { data, isLoading, isError, refetch } = useAdmins()
  const createAdmin = useCreateAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.trim().length >= 8,
    [email, password],
  )

  return (
    <Screen noPadding>
      <AdminHeader title="Admins" subtitle="Gestion des comptes administrateurs" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AdminSectionTitle title="Creer un admin" />
        <Card style={styles.formCard}>
          <Input value={firstName} onChangeText={setFirstName} placeholder="Prenom" />
          <Input value={lastName} onChangeText={setLastName} placeholder="Nom" />
          <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
          <Input value={password} onChangeText={setPassword} placeholder="Mot de passe" secureTextEntry />
          <Button
            title={createAdmin.isPending ? 'Creation...' : 'Creer admin'}
            disabled={!canSubmit || createAdmin.isPending || isOffline}
            onPress={async () => {
              if (!requireOnlineAction('creer un compte admin')) return
              try {
                await createAdmin.mutateAsync({
                  email,
                  password,
                  firstName,
                  lastName,
                  scope: 'SUPPORT',
                })
                setEmail('')
                setPassword('')
                setFirstName('')
                setLastName('')
                Alert.alert('Admin cree', 'Le compte administrateur a bien ete cree.')
              } catch (error: any) {
                Alert.alert(
                  'Creation impossible',
                  error?.response?.data?.message?.[0] ??
                    error?.response?.data?.message ??
                    'Impossible de creer cet admin.',
                )
              }
            }}
          />
        </Card>

        <AdminSectionTitle title={`Admins existants (${data?.total ?? 0})`} />
        {isLoading ? (
          <FeedbackState title="Chargement des admins" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError ? (
          <FeedbackState
            title="Impossible de charger les admins"
            description="Reessaie dans un instant."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : !data || data.items.length === 0 ? (
          <FeedbackState
            title="Aucun admin disponible"
            description="Creer un premier admin pour commencer."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : (
          <View style={styles.list}>
            {data.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/(admin)/admin-detail' as never, params: { id: item.id } })}
              >
                <Card style={styles.card}>
                  <Text style={styles.title}>{[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email}</Text>
                  <Text style={styles.meta}>{item.email ?? item.phone ?? 'Aucune coordonnee'}</Text>
                  <Text style={styles.meta}>{formatAdminScope(item.scope)}</Text>
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
  formCard: {
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
  },
  title: {
    color: colors.text,
    fontSize: 17,
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

function formatAdminScope(scope?: string | null) {
  if (!scope) return 'Scope non renseigne'
  if (scope === 'SUPER_ADMIN') return 'Super admin'
  if (scope === 'SUPPORT') return 'Support'
  if (scope === 'OPS') return 'Operations'
  return scope.replace(/_/g, ' ').toLowerCase()
}
