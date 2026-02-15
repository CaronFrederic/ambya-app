import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { colors } from '../../src/theme/colors'

export default function Caisse() {
  return (
    <Screen>
      <Header
        title="Caisse"
        subtitle="Suivi des revenus et transactions"
      />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Résumé du jour
          </Text>
          <Text style={typography.body}>
            • 5 rendez-vous
          </Text>
          <Text style={typography.body}>
            • 75 000 FCFA encaissés
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Transactions récentes
          </Text>
          <Text style={typography.body}>
            • Coupe — 15 000 FCFA
          </Text>
          <Text style={typography.body}>
            • Tresses — 25 000 FCFA
          </Text>
          <Text style={typography.body}>
            • Soins — 35 000 FCFA
          </Text>
        </Card>

        <Button
          title="Exporter les données"
          onPress={() => {}}
          variant="secondary"
        />
      </View>
    </Screen>
  )
}
