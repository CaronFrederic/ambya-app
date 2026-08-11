import React, { useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'

import { changePassword } from '../../../src/api/auth'
import { Screen } from '../../../src/components/Screen'
import { Input } from '../../../src/components/Input'
import { Button } from '../../../src/components/Button'
import { colors, overlays } from '../../../src/theme/colors'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import { typography } from '../../../src/theme/typography'
import { goBackOrReplace } from '../../../src/navigation/back'

type FormErrors = Partial<{
  currentPassword: string
  newPassword: string
  confirmPassword: string
  form: string
}>

const MIN_PASSWORD_LENGTH = 6

function friendlyPasswordError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('mot de passe actuel incorrect')) {
    return 'Le mot de passe actuel est incorrect.'
  }

  if (
    normalized.includes('mots de passe ne correspondent') ||
    normalized.includes('confirmation')
  ) {
    return 'La confirmation ne correspond pas au nouveau mot de passe.'
  }

  if (normalized.includes('different')) {
    return "Le nouveau mot de passe doit etre different de l'actuel."
  }

  if (normalized.includes('session_expired') || normalized.includes('401')) {
    return 'Votre session a expire. Reconnectez-vous pour modifier votre mot de passe.'
  }

  return 'Impossible de modifier le mot de passe pour le moment.'
}

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      Alert.alert('Mot de passe modifie', 'Votre mot de passe a ete modifie.', [
        {
          text: 'OK',
          onPress: () => goBackOrReplace('/(tabs)/profile'),
        },
      ])
    },
    onError: (error: Error) => {
      setErrors({ form: friendlyPasswordError(error.message) })
    },
  })

  const canSubmit = useMemo(
    () =>
      currentPassword.length > 0 &&
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      confirmPassword.length >= MIN_PASSWORD_LENGTH &&
      !mutation.isPending,
    [confirmPassword.length, currentPassword.length, mutation.isPending, newPassword.length],
  )

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!currentPassword) {
      nextErrors.currentPassword = 'Saisissez votre mot de passe actuel.'
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Saisissez un nouveau mot de passe.'
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.`
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirmez votre nouveau mot de passe.'
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'La confirmation ne correspond pas au nouveau mot de passe.'
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      nextErrors.newPassword = "Le nouveau mot de passe doit etre different de l'actuel."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = () => {
    if (mutation.isPending || !validate()) return

    mutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    })
  }

  return (
    <Screen noPadding keyboard style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)/profile')}
          style={styles.headerBack}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier mon mot de passe</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Securite du compte</Text>
            <Text style={styles.hint}>
              Choisissez un mot de passe different de l'actuel. Il doit contenir au moins 6 caracteres.
            </Text>

            {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

            <Input
              label="Mot de passe actuel"
              value={currentPassword}
              onChangeText={(value) => {
                setCurrentPassword(value)
                setErrors((current) => ({
                  ...current,
                  currentPassword: undefined,
                  form: undefined,
                }))
              }}
              variant="password"
              textContentType="password"
              autoComplete="current-password"
              autoCapitalize="none"
              error={errors.currentPassword}
            />

            <Input
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value)
                setErrors((current) => ({
                  ...current,
                  newPassword: undefined,
                  form: undefined,
                }))
              }}
              variant="password"
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              error={errors.newPassword}
            />

            <Input
              label="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value)
                setErrors((current) => ({
                  ...current,
                  confirmPassword: undefined,
                  form: undefined,
                }))
              }}
              variant="password"
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            <Button
              title={mutation.isPending ? 'Modification...' : 'Modifier le mot de passe'}
              onPress={submit}
              disabled={!canSubmit}
              style={styles.submit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  headerBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: overlays.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.brandForeground,
    ...typography.h2,
    fontWeight: '700',
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
    lineHeight: 19,
  },
  formError: {
    ...typography.small,
    color: colors.dangerText,
    fontWeight: '600',
  },
  submit: {
    marginTop: spacing.sm,
  },
})
