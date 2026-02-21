import { useState } from 'react'
import { View, Text, Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Button } from '../../src/components/Button'
import { assignEmployee } from '../../src/api/appointments'
import { spacing } from '../../src/theme/spacing'
import { colors } from '../../src/theme/colors'
import { typography } from '../../src/theme/typography'

export default function AssignEmployeeScreen() {
  const qc = useQueryClient()
  const params = useLocalSearchParams<{ appointmentId?: string }>()
  const appointmentId = params.appointmentId

  const [employeeId, setEmployeeId] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId) throw new Error('Missing appointmentId')
      const cleaned = employeeId.trim()
      return assignEmployee(appointmentId, cleaned.length ? cleaned : undefined)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] })
      Alert.alert('OK', 'Employé assigné')
      router.back()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Assignation échouée'
      Alert.alert('Erreur', String(msg))
    },
  })

  if (!appointmentId) {
    return (
      <Screen>
        <Header title="Assigner un employé" />
        <Card>
          <Text style={[typography.body, { color: colors.danger }]}>
            appointmentId manquant
          </Text>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Header title="Assigner un employé" subtitle="Associe un employé au rendez-vous" />

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>appointmentId</Text>
            <Text selectable style={typography.body}>
              {appointmentId}
            </Text>
          </View>

          <Input
            placeholder="employeeId"
            value={employeeId}
            onChangeText={setEmployeeId}
            autoCapitalize="none"
          />

          <Button
            title={mutation.isPending ? 'Assignation...' : 'Assigner'}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          />

          <Button
            title="Désassigner"
            onPress={() => {
              setEmployeeId('')
              mutation.mutate()
            }}
            variant="secondary"
            disabled={mutation.isPending}
          />
        </View>
      </Card>
    </Screen>
  )
}
