import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'

import { useAdminSalons } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle } from '../../src/components/AdminScaffold'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

export default function AdminSalonsScreen() {
  const [q, setQ] = useState('')
  const { data, isLoading, isError, refetch } = useAdminSalons({ q: q || undefined })

  return (
    <Screen noPadding>
      <AdminHeader
        title="Salons"
        subtitle="Suivi reseau, support et edition des donnees salon"
        rightLabel="RDV"
        onRightPress={() => router.push('/(admin)/appointments' as never)}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input value={q} onChangeText={setQ} placeholder="Rechercher un salon, une ville, une adresse..." />
        <AdminSectionTitle title={`Resultats (${data?.total ?? 0})`} />
        {isLoading ? (
          <FeedbackState title="Chargement des salons" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError ? (
          <FeedbackState
            title="Impossible de charger les salons"
            description="Reessaie dans un instant."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : !data || data.items.length === 0 ? (
          <FeedbackState
            title="Aucun salon trouve"
            description="Essaie une autre recherche ou verifie les filtres."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : (
          <View style={styles.list}>
            {data.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/(admin)/salon-detail' as never, params: { id: item.id } })}
              >
                <Card style={styles.card}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.meta}>{[item.city, item.country].filter(Boolean).join(', ')}</Text>
                  <Text style={styles.meta}>{item.address ?? 'Adresse non renseignee'}</Text>
                  <Text style={styles.meta}>{item.servicesCount} services - {item.employeesCount} employes</Text>
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
