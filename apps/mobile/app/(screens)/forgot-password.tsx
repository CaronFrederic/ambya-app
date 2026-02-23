import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Button } from '../../src/components/Button'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const initialEmail = useMemo(() => (params.email ? String(params.email) : ''), [params.email])

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)

  const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v.trim())

  const onSend = async () => {
    const v = email.trim()
    if (!v) {
      Alert.alert('Email requis', 'Veuillez saisir votre email.')
      return
    }
    if (!isValidEmail(v)) {
      Alert.alert('Email invalide', 'Veuillez saisir un email valide.')
      return
    }

    try {
      setLoading(true)

      // TODO: branchement API
      // await api.post('/auth/forgot-password', { email: v })

      // Simule une latence
      await new Promise((r) => setTimeout(r, 700))

      router.replace({
        pathname: '../(screens)/reset-password-sent',
        params: { email: v },
      })
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer le lien. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      {/* Header bordeaux */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={22} color="#fff" onPress={() => router.back()} />
        </View>
        <Text style={styles.headerTitle}>Réinitialiser le mot de passe</Text>
        <Text style={styles.headerSubtitle}>Recevez un lien de réinitialisation par email</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="ex: marie@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Comment ça marche ?</Text>
            <Text style={styles.hintText}>
              Nous vous envoyons un lien sécurisé. Ouvrez-le pour choisir un nouveau mot de passe.
            </Text>
          </View>

          <View style={{ height: spacing.lg }} />

          <Button title={loading ? 'Envoi…' : 'Envoyer le lien'} onPress={onSend} disabled={loading} />
          <View style={{ height: spacing.sm }} />
          <Button title="Retour" variant="secondary" onPress={() => router.back()} disabled={loading} />
        </Card>

        <View style={{ height: 28 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { marginBottom: spacing.md },
  headerTitle: { color: colors.brandForeground, ...typography.h2, fontWeight: '800' },
  headerSubtitle: { marginTop: 6, color: 'rgba(255,255,255,0.80)', ...typography.small },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 80,
  },

  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  label: { color: colors.text, ...typography.small, fontWeight: '800', marginBottom: spacing.sm },

  hintBox: {
    marginTop: spacing.md,
    backgroundColor: overlays.premium10,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: overlays.premium20,
  },
  hintTitle: { color: colors.brand, ...typography.h3, fontWeight: '800' },
  hintText: { marginTop: 6, color: colors.textMuted, ...typography.small },
})
