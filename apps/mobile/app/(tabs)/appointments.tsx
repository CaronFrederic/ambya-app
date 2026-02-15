import { useState } from 'react'
import { View, Text, FlatList, RefreshControl } from 'react-native'
import { router } from 'expo-router'

import { useAppointments } from '../../src/api/appointments'
import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'
import { colors } from '../../src/theme/colors'
import { typography } from '../../src/theme/typography'

export default function AppointmentsScreen() {
  const { data, isLoading, isError, refetch } = useAppointments()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <Screen>
      <Header title="Rendez-vous" subtitle="Tes prochains rendez-vous" />

      <View style={{ marginBottom: spacing.md }}>
        <Button
          title="Créer un RDV"
          onPress={() => router.push('/(tabs)/create-appointment')}
          variant="secondary"
        />
      </View>

      {isLoading ? (
        <Card>
          <Text style={typography.body}>Chargement des rendez-vous...</Text>
        </Card>
      ) : isError ? (
        <Card>
          <Text style={typography.body}>Erreur lors du chargement.</Text>
          <Text
            onPress={() => refetch()}
            style={[
              typography.body,
              { marginTop: spacing.sm, textDecorationLine: 'underline', color: colors.text },
            ]}
          >
            Réessayer
          </Text>
        </Card>
      ) : !data?.items?.length ? (
        <Card>
          <Text style={typography.body}>Aucun rendez-vous pour le moment.</Text>
        </Card>
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <Card>
              <View style={{ gap: spacing.xs }}>
                <Text style={typography.medium}>{item.service.name}</Text>
                <Text style={typography.body}>{item.salon.name}</Text>
                <Text style={typography.body}>{item.status}</Text>
                <Text style={typography.body}>
                  {item.employee?.displayName ?? 'Non assigné'}
                </Text>

                <View style={{ marginTop: spacing.sm }}>
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
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
