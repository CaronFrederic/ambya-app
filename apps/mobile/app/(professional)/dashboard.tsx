import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { colors } from '../../src/theme/colors'

export default function Dashboard() {
  return (
    <Screen>
      <Header
        title="Tableau de bord"
        subtitle="Vue globale de ton salon"
      />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Aujourd’hui
          </Text>
          <Text style={typography.body}>
            • 8 rendez-vous
          </Text>
          <Text style={typography.body}>
            • 120 000 FCFA générés
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Employés actifs
          </Text>
          <Text style={typography.body}>
            • 3 disponibles
          </Text>
          <Text style={typography.body}>
            • 1 en congé
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Activité récente
          </Text>
          <Text style={typography.body}>
            • Nouveau RDV confirmé
          </Text>
          <Text style={typography.body}>
            • Paiement validé
          </Text>
        </Card>

        <Button
          title="Gérer les services"
          onPress={() => {}}
        />

        <Button
          title="Voir la caisse"
          onPress={() => {}}
          variant="secondary"
        />
      </View>
    </Screen>
  )
}
