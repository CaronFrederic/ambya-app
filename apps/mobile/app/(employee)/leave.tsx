import { useState } from 'react'
import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'

export default function Leave() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  return (
    <Screen>
      <Header
        title="Congé"
        subtitle="Déclare une période d’indisponibilité"
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Input
            placeholder="Date de début (ISO)"
            value={startDate}
            onChangeText={setStartDate}
          />

          <Input
            placeholder="Date de fin (ISO)"
            value={endDate}
            onChangeText={setEndDate}
          />

          <Input
            placeholder="Motif (optionnel)"
            value={reason}
            onChangeText={setReason}
          />

          <Button
            title="Soumettre"
            onPress={() => {}}
          />
        </View>
      </Card>
    </Screen>
  )
}
