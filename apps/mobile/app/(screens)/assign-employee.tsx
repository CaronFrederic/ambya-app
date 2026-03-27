import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'

import { assignEmployee } from '../../src/api/appointments'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Header } from '../../src/components/Header'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { isOfflineActionError, requireOnlineAction } from '../../src/offline/guard'
import { useOfflineStatus } from '../../src/providers/OfflineProvider'
import { colors } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function AssignEmployeeScreen() {
  const qc = useQueryClient()
  const { isOffline } = useOfflineStatus()
  const params = useLocalSearchParams<{ appointmentId?: string }>()
  const appointmentId = params.appointmentId

  const [employeeId, setEmployeeId] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId) throw new Error('Missing appointmentId')
      if (!requireOnlineAction('assigner un employe')) {
        throw new Error('Action indisponible hors ligne')
      }

      const cleaned = employeeId.trim()
      return assignEmployee(appointmentId, cleaned.length ? cleaned : undefined)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] })
      Alert.alert('OK', 'Employe assigne')
      router.back()
    },
    onError: (err: any) => {
      if (isOfflineActionError(err) || err?.message === 'Action indisponible hors ligne') return
      const msg = err?.response?.data?.message ?? err?.message ?? 'Assignation echouee'
      Alert.alert('Erreur', String(msg))
    },
  })

  if (!appointmentId) {
    return (
      <Screen>
        <Header title="Assigner un employe" />
        <Card>
          <Text style={[typography.body, { color: colors.danger }]}>appointmentId manquant</Text>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Header title="Assigner un employe" subtitle="Associe un employe au rendez-vous" />

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
            disabled={mutation.isPending || isOffline}
          />

          <Button
            title="Desassigner"
            onPress={() => {
              setEmployeeId('')
              mutation.mutate()
            }}
            variant="secondary"
            disabled={mutation.isPending || isOffline}
          />
        </View>
      </Card>
    </Screen>
  )
}
