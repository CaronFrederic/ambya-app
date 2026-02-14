import { View, Text, FlatList, RefreshControl } from 'react-native'
import { useState } from 'react'
import { useAppointments } from '../../src/api/appointments'

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
      <View style={{ padding: 16 }}>
        <Text>Aucun rendez-vous pour le moment.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={data.items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1 }}>
          <Text style={{ fontWeight: '600' }}>{item.service.name}</Text>
          <Text>{item.salon.name}</Text>
          <Text>{item.status}</Text>
        </View>
      )}
    />
  )
}
