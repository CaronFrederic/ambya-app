import { View, Text } from 'react-native'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { colors } from '../../src/theme/colors'

export default function Employees() {
  return (
    <Screen>
      <Header
        title="Employés"
        subtitle="Gestion de ton équipe"
      />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Marie
          </Text>
          <Text style={typography.body}>
            Statut : Disponible
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Amina
          </Text>
          <Text style={typography.body}>
            Statut : En congé
          </Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Jean
          </Text>
          <Text style={typography.body}>
            Statut : Disponible
          </Text>
        </Card>

        <Button
          title="Ajouter un employé"
          onPress={() => {}}
        />
      </View>
    </Screen>
  )
}
