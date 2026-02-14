import { useState } from 'react'
import { View, Text, TextInput, Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { createAppointment } from '../../src/api/appointments'

export default function CreateAppointmentScreen() {
  const qc = useQueryClient()

  const [salonId, setSalonId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [startAt, setStartAt] = useState(new Date(Date.now() + 60_000).toISOString())
  const [note, setNote] = useState('')

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] })
      Alert.alert('OK', 'RDV créé')
      router.replace('/(tabs)/appointments')
    },
    onError: () => {
      Alert.alert('Erreur', 'Création RDV échouée')
    },
  })

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Créer un RDV</Text>

      <View style={{ gap: 12 }}>
        <TextInput
          placeholder="salonId"
          value={salonId}
          onChangeText={setSalonId}
          autoCapitalize="none"
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />
        <TextInput
          placeholder="serviceId"
          value={serviceId}
          onChangeText={setServiceId}
          autoCapitalize="none"
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />
        <TextInput
          placeholder="startAt (ISO)"
          value={startAt}
          onChangeText={setStartAt}
          autoCapitalize="none"
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />
        <TextInput
          placeholder="note (optionnel)"
          value={note}
          onChangeText={setNote}
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />

        <Button
          title={mutation.isPending ? 'Création...' : 'Créer'}
          onPress={() => mutation.mutate({ salonId, serviceId, startAt, note })}
          disabled={mutation.isPending}
        />
      </View>
    </Screen>
  )
}
