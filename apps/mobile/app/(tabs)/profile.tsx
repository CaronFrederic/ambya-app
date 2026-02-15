import { View, Text } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { spacing } from '../../src/theme/spacing'

export default function Profile() {
  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('userRole')
    router.replace('/(auth)/login')
  }

  return (
    <Screen>
      <Header title="Profil" subtitle="Compte et sécurité" />

      <View style={{ gap: spacing.md }}>
        <Card>
          <Text>Compte</Text>
          <Text>• Email</Text>
          <Text>• Téléphone</Text>
        </Card>

        <Card>
          <Text>Sécurité</Text>
          <Text>• Mot de passe</Text>
          <Text>• MFA (à venir)</Text>
        </Card>

        <Card>
          <Text>Support</Text>
          <Text>• Aide</Text>
          <Text>• Conditions</Text>
        </Card>

        <Button title="Se déconnecter" onPress={logout} variant="secondary" />
      </View>
    </Screen>
  )
}
