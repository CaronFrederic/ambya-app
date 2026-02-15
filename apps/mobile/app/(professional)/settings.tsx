import { View, Text } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { colors } from '../../src/theme/colors'

export default function Settings() {
  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('userRole')
    router.replace('/(auth)/login')
  }

  return (
    <Screen>
      <Header title="Paramètres" subtitle="Configuration du salon" />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Informations du salon
          </Text>
          <Text style={typography.body}>• Nom</Text>
          <Text style={typography.body}>• Adresse</Text>
          <Text style={typography.body}>• Téléphone</Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Sécurité
          </Text>
          <Text style={typography.body}>• Modifier mot de passe</Text>
          <Text style={typography.body}>• MFA (à venir)</Text>
        </Card>

        <Card>
          <Text style={[typography.medium, { color: colors.text }]}>
            Facturation
          </Text>
          <Text style={typography.body}>• Plan abonnement (à venir)</Text>
        </Card>

        <Button title="Se déconnecter" onPress={logout} variant="secondary" />
      </View>
    </Screen>
  )
}
