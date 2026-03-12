import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { initialEmployeeProfile } from '../../src/features/employee/data'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function EmployeeActivateScreen() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const hasMinLength = password.trim().length >= 6
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const canSubmit = hasMinLength && passwordsMatch

  const passwordIcon = useMemo(
    () => <Ionicons name="eye-outline" size={18} color={colors.textMuted} />,
    [],
  )

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Creer mon mot de passe</Text>
        <Text style={styles.headerSubtitle}>Finalisez la creation de votre compte</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.notice}>
          <Ionicons name="alert-circle-outline" size={18} color="#D4AF6A" />
          <Text style={styles.noticeText}>
            Votre compte est rattache a votre salon. Apres creation du mot de passe, connectez-vous avec votre email ou telephone.
          </Text>
        </View>

        <Card style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={18} color={colors.brand} />
            </View>

            <View style={styles.identityCopy}>
              <Text style={styles.identityName}>
                {initialEmployeeProfile.firstName} {initialEmployeeProfile.lastName}
              </Text>
              <Text style={styles.identityRole}>{initialEmployeeProfile.role}</Text>
            </View>
          </View>

          <View style={styles.identityDivider} />

          <View style={styles.identityMeta}>
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
            <Text style={styles.identityMetaText}>{initialEmployeeProfile.email}</Text>
          </View>

          <View style={styles.identityMeta}>
            <Ionicons name="call-outline" size={16} color={colors.textMuted} />
            <Text style={styles.identityMetaText}>{initialEmployeeProfile.phone}</Text>
          </View>
        </Card>

        <Input
          label="Nouveau mot de passe"
          placeholder="Minimum 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          right={passwordIcon}
        />

        <Input
          label="Confirmer le mot de passe"
          placeholder="Confirmez votre mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          right={passwordIcon}
        />

        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>Le mot de passe doit contenir :</Text>
          <RuleRow label="Minimum 6 caracteres" valid={hasMinLength} />
          <RuleRow label="Les mots de passe correspondent" valid={passwordsMatch} />
        </View>

        <Button
          title="Valider"
          disabled={!canSubmit}
          onPress={() => router.replace('./employee-activation-success')}
        />

        <Pressable onPress={() => router.replace('./login')}>
          <Text style={styles.link}>Retour a la connexion</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

function RuleRow({ label, valid }: { label: string; valid: boolean }) {
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleBullet, valid && styles.ruleBulletValid]} />
      <Text style={[styles.ruleText, valid && styles.ruleTextValid]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.brandForeground,
    ...typography.h2,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.86)',
    ...typography.small,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.35)',
    backgroundColor: '#FBF5E9',
  },
  noticeText: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    lineHeight: 22,
  },
  identityCard: {
    borderRadius: radius.xl,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: 'rgba(107,39,55,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
  },
  identityName: {
    color: colors.text,
    ...typography.medium,
    fontWeight: '700',
  },
  identityRole: {
    marginTop: 2,
    color: colors.textMuted,
    ...typography.body,
  },
  identityDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  identityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  identityMetaText: {
    color: colors.textMuted,
    ...typography.body,
  },
  rules: {
    gap: spacing.sm,
  },
  rulesTitle: {
    color: colors.textMuted,
    ...typography.small,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ruleBullet: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: '#D1D1D1',
  },
  ruleBulletValid: {
    backgroundColor: '#16A34A',
  },
  ruleText: {
    color: colors.text,
    ...typography.small,
  },
  ruleTextValid: {
    color: '#166534',
    fontWeight: '700',
  },
  link: {
    color: colors.brand,
    ...typography.small,
    fontWeight: '700',
    textAlign: 'center',
  },
})
