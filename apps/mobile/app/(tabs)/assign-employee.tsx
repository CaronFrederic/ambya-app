import { useState } from 'react'
import { View, Text, TextInput, Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { assignEmployee } from '../../src/api/appointments'

export default function AssignEmployeeScreen() {
  const qc = useQueryClient()
  const params = useLocalSearchParams<{ appointmentId?: string }>()
  const appointmentId = params.appointmentId

  const [employeeId, setEmployeeId] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId) throw new Error('Missing appointmentId')
      return assignEmployee(appointmentId, employeeId || undefined)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] })
      Alert.alert('OK', 'Employé assigné')
      router.back()
    },
    onError: () => Alert.alert('Erreur', 'Assignation échouée'),
  })

  if (!appointmentId) {
    return (
      <Screen>
        <Text>appointmentId manquant</Text>
      </Screen>
    )
  }

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Assigner un employé</Text>

      <View style={{ gap: 12 }}>
        <Text style={{ opacity: 0.7 }}>appointmentId</Text>
        <Text selectable>{appointmentId}</Text>

        <TextInput
          placeholder="employeeId"
          value={employeeId}
          onChangeText={setEmployeeId}
          autoCapitalize="none"
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />

        <Button
          title={mutation.isPending ? 'Assignation...' : 'Assigner'}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        />

        <Button
          title="Désassigner (null)"
          onPress={() => {
            setEmployeeId('')
            mutation.mutate()
          }}
          variant="secondary"
          disabled={mutation.isPending}
        />
      </View>
    </Screen>
  )
}
