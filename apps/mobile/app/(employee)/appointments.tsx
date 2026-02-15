import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { colors } from '../../src/theme/colors'

export default function EmployeeAppointments() {
  return (
    <Screen>
      <Header
        title="Mes rendez-vous"
        subtitle="Planning assigné"
      />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Aujourd’hui
          </Text>
          <Text style={typography.body}>
            • 10:00 — Coupe (mock)
          </Text>
          <Text style={typography.body}>
            • 14:00 — Tresses (mock)
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Prochains
          </Text>
          <Text style={typography.body}>
            • Demain — Soins visage (mock)
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Statut
          </Text>
          <Text style={typography.body}>
            • Confirmés / En attente / Terminés (à venir)
          </Text>
        </Card>
      </View>
    </Screen>
  )
}
