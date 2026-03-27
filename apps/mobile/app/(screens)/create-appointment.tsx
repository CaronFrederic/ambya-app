import { useState } from 'react'
import { Alert, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'

import { createAppointment } from '../../src/api/appointments'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Header } from '../../src/components/Header'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { isOfflineActionError, requireOnlineAction } from '../../src/offline/guard'
import { useOfflineStatus } from '../../src/providers/OfflineProvider'
import { spacing } from '../../src/theme/spacing'

export default function CreateAppointmentScreen() {
  const qc = useQueryClient()
  const { isOffline } = useOfflineStatus()

  const [salonId, setSalonId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [startAt, setStartAt] = useState(new Date(Date.now() + 60_000).toISOString())
  const [note, setNote] = useState('')

  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof createAppointment>[0]) => {
      if (!requireOnlineAction('creer un rendez-vous')) {
        throw new Error('Action indisponible hors ligne')
      }

      return createAppointment(payload)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] })
      Alert.alert('OK', 'Rendez-vous cree')
      router.replace('/(tabs)/appointments')
    },
    onError: (error: any) => {
      if (isOfflineActionError(error) || error?.message === 'Action indisponible hors ligne') return
      Alert.alert(
        'Erreur',
        error?.response?.data?.message?.[0] ??
          error?.response?.data?.message ??
          error?.message ??
          'Creation du rendez-vous echouee',
      )
    },
  })

  return (
    <Screen>
      <Header title="Creer un rendez-vous" subtitle="Renseigne les informations du rendez-vous" />

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

          <Input placeholder="note (optionnel)" value={note} onChangeText={setNote} />

          <Button
            title={mutation.isPending ? 'Creation...' : 'Creer'}
            onPress={() => mutation.mutate({ salonId, serviceId, startAt, note })}
            disabled={mutation.isPending || isOffline}
          />
        </View>
      </Card>
    </Screen>
  )
}
