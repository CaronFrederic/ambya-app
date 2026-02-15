import { View, Text, FlatList, RefreshControl } from 'react-native'
import { useState } from 'react'
import { useAppointments } from '../../src/api/appointments'
import { Button } from '../../src/components/Button'
import { Screen } from '../../src/components/Screen'
import { router } from 'expo-router'

export default function AppointmentsScreen() {
  const { data, isLoading, isError, refetch } = useAppointments()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (isLoading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Chargement des rendez-vous...</Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Erreur lors du chargement.</Text>
        <Text onPress={() => refetch()} style={{ marginTop: 8, textDecorationLine: 'underline' }}>
          Réessayer
        </Text>
      </View>
    )
  }

  if (!data?.items?.length) {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Button
        title="Créer un RDV"
        onPress={() => router.push('/(tabs)/create-appointment')}
        variant="secondary"
      />
      <Text>Aucun rendez-vous pour le moment.</Text>
    </View>
  )
}


  <Button
  title="Créer un RDV"
  onPress={() => router.push('/(tabs)/create-appointment')}
  variant="secondary"
  />

  return (
    <Screen>
      <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Button
          title="Créer un RDV"
          onPress={() => router.push('/(tabs)/create-appointment')}
          variant="secondary"
        />
      </View>

      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: '600' }}>{item.service.name}</Text>
            <Text>{item.salon.name}</Text>
            <Text>{item.status}</Text>
            <Text>{item.employee?.displayName ?? 'Non assigné'}</Text>
            <Button
              title="Assigner employé"
              variant="secondary"
              onPress={() => router.push({ pathname: '/(tabs)/assign-employee', params: { appointmentId: item.id } })}
            />
          </View>
        )}
      />
    </View>
  </Screen>
  )
}
