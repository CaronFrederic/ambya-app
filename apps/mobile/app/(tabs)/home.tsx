import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'

export default function Home() {
  return (
    <Screen>
      <Header
        title="Bienvenue"
        subtitle="Gère tes rendez-vous facilement"
      />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text>Prochains rendez-vous</Text>
        </Card>

        <Card>
          <Text>Rechercher un salon</Text>
        </Card>

        <Card>
          <Text>Mes services favoris</Text>
        </Card>

        <Button
          title="Voir mes rendez-vous"
          onPress={() => {}}
        />
      </View>
    </Screen>
  )
}
