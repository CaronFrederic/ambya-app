import { useState } from 'react'
import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { spacing } from '../../src/theme/spacing'

export default function Search() {
  const [query, setQuery] = useState('')

  return (
    <Screen>
      <Header
        title="Recherche"
        subtitle="Trouve un salon près de toi"
      />

      <View style={{ gap: spacing.md }}>
        <Input
          placeholder="Rechercher un salon..."
          value={query}
          onChangeText={setQuery}
        />

        <Card>
          <Text>Résultat 1 (mock)</Text>
        </Card>

        <Card>
          <Text>Résultat 2 (mock)</Text>
        </Card>
      </View>
    </Screen>
  )
}
