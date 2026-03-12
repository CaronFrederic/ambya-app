import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Button } from '../../src/components/Button'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function EmployeeActivationSuccessScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={34} color="#16A34A" />
        </View>

        <Text style={styles.title}>Mot de passe cree !</Text>
        <Text style={styles.description}>
          Votre compte est active. Vous pouvez maintenant acceder a votre espace employe.
        </Text>

        <Button
          title="Acceder a mon espace"
          onPress={() => router.replace('./login')}
          style={styles.button}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: '#DDF5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.brand,
    ...typography.h2,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.md,
    color: colors.text,
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    marginTop: spacing.xl,
  },
})
