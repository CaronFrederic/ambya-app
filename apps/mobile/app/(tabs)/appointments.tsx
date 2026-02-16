import { useMemo, useState } from 'react'
import { View, Text, FlatList, RefreshControl } from 'react-native'
import { router } from 'expo-router'

import { useAppointments } from '../../src/api/appointments'
import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { SegmentedTabs } from '../../src/components/SegmentedTabs'
import { StatusPill } from '../../src/components/StatusPill'

import { spacing } from '../../src/theme/spacing'
import { colors } from '../../src/theme/colors'
import { AppointmentStatus } from '@prisma/client'

type TabKey = 'upcoming' | 'past'

function toTone(status: AppointmentStatus): 'success' | 'warning' | 'danger' {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'PENDING') return 'warning'
  return 'danger'
}

function toLabel(status: AppointmentStatus) {
  if (status === 'CONFIRMED') return 'Confirmé'
  if (status === 'PENDING') return 'En attente'
  if (status === 'CANCELLED') return 'Annulé'
  if (status === 'REJECTED') return 'Refusé'
  if (status === 'COMPLETED') return 'Terminé'
  if (status === 'NO_SHOW') return 'Absent'
  return status
}

export default function AppointmentsScreen() {
  const { data, isLoading, isError, refetch } = useAppointments()
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<TabKey>('upcoming')

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const items = data?.items ?? []

  const filtered = useMemo(() => {
    const now = Date.now()
    return items.filter((a) => {
      const start = new Date(a.startAt).getTime()
      return tab === 'upcoming' ? start >= now : start < now
    })
  }, [items, tab])

  return (
    <Screen>
      <Header title="Mes rendez-vous" canGoBack={false} />

      <SegmentedTabs value={tab} onChange={setTab} />

      {/* CTA (optionnel pour la beta) */}
      <View style={{ marginBottom: spacing.lg }}>
        <Button
          title="Créer un RDV"
          onPress={() => router.push('/(tabs)/create-appointment')}
          variant="secondary"
        />
      </View>

      {isLoading ? (
        <Card>
          <Text>Chargement...</Text>
        </Card>
      ) : isError ? (
        <Card>
          <Text>Erreur lors du chargement.</Text>
          <Text
            onPress={() => refetch()}
            style={{ marginTop: spacing.sm, textDecorationLine: 'underline', color: colors.text }}
          >
            Réessayer
          </Text>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <Text>{tab === 'upcoming' ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous passé.'}</Text>
        </Card>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => (
            <Card>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>{item.salon.name}</Text>
                    <Text style={{ color: colors.textMuted }}>{item.service.name}</Text>
                  </View>

                  <StatusPill
                    label={toLabel(item.status as AppointmentStatus)}
                    tone={toTone(item.status as AppointmentStatus)}
                  />
                </View>

                <Text style={{ color: colors.textMuted }}>
                  {new Date(item.startAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                  • {new Date(item.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>

                {/* Assign employee (optionnel beta) */}
                <Button
                  title="Assigner employé"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/assign-employee',
                      params: { appointmentId: item.id },
                    })
                  }
                />
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
