import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'

import { Screen } from '../../src/components/Screen'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'
import { useAuthRefresh } from '../../src/providers/AuthRefreshProvider'

export default function ResetPasswordSentScreen() {
  const { refreshAuth } = useAuthRefresh()
  const params = useLocalSearchParams<{ email?: string }>()
  const email = useMemo(() => (params.email ? String(params.email) : ''), [params.email])

  async function handleLogout() {
  await SecureStore.deleteItemAsync('accessToken')
  await SecureStore.deleteItemAsync('userRole')
  await refreshAuth()

  router.replace('/(auth)/login')
}

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="close" size={22} color="#fff" onPress={handleLogout} />
        </View>
        <Text style={styles.headerTitle}>Email envoyé</Text>
        <Text style={styles.headerSubtitle}>Vérifiez votre boîte de réception</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="mail-outline" size={26} color={colors.brand} />
          </View>

          <Text style={styles.title}>Lien de réinitialisation</Text>
          <Text style={styles.text}>
            Nous avons envoyé un lien sécurisé {email ? `à ${email}` : "à votre adresse email"}.
            Ouvrez-le pour choisir un nouveau mot de passe.
          </Text>

          <View style={{ height: spacing.lg }} />

          <Button title="Retour à la connexion" onPress={handleLogout} />
          <View style={{ height: spacing.sm }} />
          <Button title="Renvoyer" variant="secondary" onPress={() => router.replace({ pathname: '../(auth)/forgot-password', params: { email } })} />
        </Card>
      </View>
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
  headerRow: { marginBottom: spacing.md, alignItems: 'flex-end' },
  headerTitle: { color: colors.brandForeground, ...typography.h2, fontWeight: '800' },
  headerSubtitle: { marginTop: 6, color: 'rgba(255,255,255,0.80)', ...typography.small },

  content: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: overlays.brand10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  title: { color: colors.text, ...typography.h3, fontWeight: '900' },
  text: { marginTop: 6, color: colors.textMuted, ...typography.body, lineHeight: 20 },
})
