import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { colors } from '../../src/theme/colors'

export default function Services() {
  return (
    <Screen>
      <Header
        title="Services"
        subtitle="Gestion des prestations proposées"
      />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Coupe femme
          </Text>
          <Text style={typography.body}>
            Durée : 45 min
          </Text>
          <Text style={typography.body}>
            Prix : 15 000 FCFA
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Tresses
          </Text>
          <Text style={typography.body}>
            Durée : 90 min
          </Text>
          <Text style={typography.body}>
            Prix : 25 000 FCFA
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Soins visage
          </Text>
          <Text style={typography.body}>
            Durée : 60 min
          </Text>
          <Text style={typography.body}>
            Prix : 20 000 FCFA
          </Text>
        </Card>

        <Button
          title="Ajouter un service"
          onPress={() => {}}
        />
      </View>
    </Screen>
  )
}
