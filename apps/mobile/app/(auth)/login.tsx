import { useState } from 'react'
import { ActivityIndicator, View, Text } from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Button } from '../../src/components/Button'
import { login } from '../../src/api/auth'
import { spacing } from '../../src/theme/spacing'
import { colors } from '../../src/theme/colors'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await login({ email, password })
      await SecureStore.setItemAsync('accessToken', data.accessToken)
      await SecureStore.setItemAsync('userRole', data.user.role)

      router.replace('/(tabs)/appointments')
    } catch (e) {
      setError('Connexion impossible. Vérifie email/mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Header title="Connexion" subtitle="Accède à ton espace Ambya" />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Input
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            placeholder="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

          <Button
            title={loading ? 'Connexion...' : 'Se connecter'}
            onPress={onSubmit}
            disabled={loading}
          />

          {loading ? <ActivityIndicator /> : null}
        </View>
      </Card>

      {/* Debug / dev shortcuts (tu peux retirer plus tard) */}
      <View style={{ marginTop: spacing.lg }}>
        <Button
          title="Entrer (Client) - Appointments (mock)"
          onPress={() => router.replace('/(tabs)/appointments')}
          variant="secondary"
        />
      </View>
    </Screen>
  )
}
