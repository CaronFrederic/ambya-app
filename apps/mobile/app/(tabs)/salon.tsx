import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { colors } from '../../src/theme/colors'

export default function Salon() {
  return (
    <Screen>
      <Header title="Salon" subtitle="Détails du salon & services" />

      <View style={{ gap: spacing.md }}>
        <Card>
          <View style={{ gap: spacing.xs }}>
            <Text style={[typography.medium, { color: colors.text }]}>
              Ambya Beauty Salon (mock)
            </Text>
            <Text style={typography.body}>Libreville, Gabon</Text>
            <Text style={typography.body}>📍 Adresse (à venir)</Text>
            <Text style={typography.body}>📞 Téléphone (à venir)</Text>
          </View>
        </Card>

        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.medium, { color: colors.text }]}>Services</Text>
            <View style={{ gap: spacing.xs }}>
              <Text style={typography.body}>• Coupe femme (mock)</Text>
              <Text style={typography.body}>• Tresses (mock)</Text>
              <Text style={typography.body}>• Soins visage (mock)</Text>
            </View>
          </View>
        </Card>

        <Button title="Prendre rendez-vous" onPress={() => {}} />
      </View>
    </Screen>
  )
}
