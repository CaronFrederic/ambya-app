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
        subtitle="Vue rapide de ton activité"
      />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Aujourd’hui
          </Text>
          <Text style={typography.body}>
            • 3 rendez-vous
          </Text>
          <Text style={typography.body}>
            • 1 en attente
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Prochain rendez-vous
          </Text>
          <Text style={typography.body}>
            10:00 — Coupe (mock)
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Disponibilité
          </Text>
          <Text style={typography.body}>
            Statut : Disponible
          </Text>
        </Card>

        <Button
          title="Voir mes rendez-vous"
          onPress={() => {}}
        />
      </View>
    </Screen>
  )
}
