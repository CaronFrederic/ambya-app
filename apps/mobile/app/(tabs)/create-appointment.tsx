import { useState } from 'react'
import { View, Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Button } from '../../src/components/Button'
import { createAppointment } from '../../src/api/appointments'
import { spacing } from '../../src/theme/spacing'

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
      <Header title="Créer un RDV" subtitle="Renseigne les informations du rendez-vous" />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Input
            placeholder="salonId"
            value={salonId}
            onChangeText={setSalonId}
            autoCapitalize="none"
          />

          <Input
            placeholder="serviceId"
            value={serviceId}
            onChangeText={setServiceId}
            autoCapitalize="none"
          />

          <Input
            placeholder="startAt (ISO)"
            value={startAt}
            onChangeText={setStartAt}
            autoCapitalize="none"
          />

          <Input
            placeholder="note (optionnel)"
            value={note}
            onChangeText={setNote}
          />

          <Button
            title={mutation.isPending ? 'Création...' : 'Créer'}
            onPress={() => mutation.mutate({ salonId, serviceId, startAt, note })}
            disabled={mutation.isPending}
          />
        </View>
      </Card>
    </Screen>
  )
}
