import { useState } from 'react'
import { Text, TextInput, View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { login } from '../../src/api/auth'

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

      // ✅ minimal: on va direct sur RDV pour valider le point
      router.replace('/(tabs)/appointments')
    } catch (e) {
      setError('Connexion impossible. Vérifie email/mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 16 }}>Login</Text>

      <View style={{ gap: 12 }}>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />

        <TextInput
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />

        {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

        <Button
          title={loading ? 'Connexion...' : 'Se connecter'}
          onPress={onSubmit}
          disabled={loading}
        />

        {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
      </View>

      {/* Boutons temporaires (optionnel) : garde-les si tu veux naviguer vite */}
      <View style={{ marginTop: 24, gap: 8 }}>
        <Button title="Entrer (Client) - Appointments (mock)" onPress={() => router.replace('/(tabs)/appointments')} variant="secondary" />
      </View>
    </Screen>
  )
}
