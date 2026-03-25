import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useQueryClient } from '@tanstack/react-query'

import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { EmployeeModal } from '../../src/components/employee/EmployeeModal'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { useEmployeeProfile, useUpdateEmployeeProfile } from '../../src/api/employee'
import { useAuthRefresh } from '../../src/providers/AuthRefreshProvider'
import { colors, overlays } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function EmployeeProfileScreen() {
  const { refreshAuth } = useAuthRefresh()
  const queryClient = useQueryClient()
  const profileQuery = useEmployeeProfile()
  const updateProfile = useUpdateEmployeeProfile()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (!profileQuery.data?.profile || isEditing) return
    setFirstName(profileQuery.data.profile.firstName ?? '')
    setLastName(profileQuery.data.profile.lastName ?? '')
    setEmail(profileQuery.data.profile.email ?? '')
    setPhone(profileQuery.data.profile.phone ?? '')
  }, [isEditing, profileQuery.data?.profile])

  useFocusEffect(
    React.useCallback(() => {
      void profileQuery.refetch()
    }, [profileQuery.refetch]),
  )

  const onLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('userRole')
    queryClient.clear()
    await refreshAuth()
    router.replace('/(auth)/login')
  }

  const handleUpdate = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      await profileQuery.refetch()
      setIsEditing(false)
      Alert.alert('Profil mis a jour', 'Vos informations ont bien ete enregistrees.')
    } catch (error: any) {
      Alert.alert('Impossible de mettre a jour le profil', error?.message ?? 'Erreur inconnue')
    }
  }

  const handleCancel = () => {
    setFirstName(profileQuery.data?.profile.firstName ?? '')
    setLastName(profileQuery.data?.profile.lastName ?? '')
    setEmail(profileQuery.data?.profile.email ?? '')
    setPhone(profileQuery.data?.profile.phone ?? '')
    setIsEditing(false)
  }

  if (profileQuery.isLoading) {
    return (
      <Screen style={styles.screen}>
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </Screen>
    )
  }

  if (profileQuery.isError || !profileQuery.data?.profile) {
    return (
      <Screen style={styles.screen}>
        <Text style={styles.loadingText}>Impossible de charger le profil employe.</Text>
      </Screen>
    )
  }

  const profile = profileQuery.data.profile

  return (
    <Screen noPadding keyboard style={styles.screen}>
      <EmployeeHeader
        title="Mon Profil"
        canGoBack
        onBackPress={() => router.push('./dashboard')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Mes informations</Text>

          <Input
            label="Prenom"
            value={firstName}
            onChangeText={setFirstName}
            containerStyle={styles.field}
            editable={isEditing}
          />
          <Input
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            containerStyle={styles.field}
            editable={isEditing}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.field}
            editable={isEditing}
          />
          <Input
            label="Telephone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            containerStyle={styles.field}
            editable={isEditing}
          />
          <Input label="Role" value={profile.role} editable={false} containerStyle={styles.field} />
          <Input label="Salon" value={profile.salon} editable={false} />

          {isEditing ? (
            <Pressable
              onPress={handleUpdate}
              style={styles.primaryButtonWide}
              disabled={updateProfile.isPending}
            >
              <Ionicons name="save-outline" size={16} color={colors.brandForeground} />
              <Text style={styles.primaryButtonText}>
                {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setIsEditing(true)} style={styles.primaryButtonWide}>
              <Ionicons name="create-outline" size={16} color={colors.brandForeground} />
              <Text style={styles.primaryButtonText}>Modifier mes informations</Text>
            </Pressable>
          )}

          {isEditing ? (
            <Pressable onPress={handleCancel} style={styles.cancelButtonWide}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          ) : null}
        </Card>

        <Card style={styles.securityCard}>
          <Text style={styles.sectionTitle}>Securite</Text>
          <Text style={styles.sectionDescription}>Gerez votre mot de passe</Text>

          <Pressable
            onPress={() => setShowResetConfirm(true)}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>Reinitialiser le mot de passe</Text>
          </Pressable>
        </Card>

        <Pressable onPress={onLogout} style={styles.logoutCard}>
          <Text style={styles.logoutText}>Deconnexion</Text>
        </Pressable>
      </ScrollView>

      <EmployeeModal
        visible={showResetConfirm}
        title="Reinitialiser le mot de passe"
        onClose={() => setShowResetConfirm(false)}
        footer={
          <>
            <Pressable onPress={() => setShowResetConfirm(false)} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowResetConfirm(false)
                router.push({
                  pathname: '/(screens)/forgot-password',
                  params: { email },
                })
              }}
              style={styles.modalConfirmButton}
            >
              <Text style={styles.modalConfirmText}>Envoyer</Text>
            </Pressable>
          </>
        }
      >
        <Text style={styles.modalBodyText}>
          Un email de reinitialisation sera envoye a{'\n'}
          <Text style={styles.modalBodyStrong}>{email}</Text>
        </Text>
      </EmployeeModal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  loadingText: {
    color: colors.text,
    ...typography.body,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  formCard: {
    borderRadius: 18,
    padding: spacing.lg,
  },
  formTitle: {
    color: colors.brand,
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.sm,
  },
  primaryButtonWide: {
    marginTop: spacing.lg,
    height: 40,
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cancelButtonWide: {
    marginTop: spacing.sm,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: '#FBF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.brandForeground,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: colors.text,
    ...typography.body,
    fontWeight: '500',
  },
  securityCard: {
    borderRadius: 18,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.brand,
    ...typography.h3,
    fontWeight: '700',
  },
  sectionDescription: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    ...typography.body,
  },
  outlineButton: {
    marginTop: spacing.lg,
    minHeight: 46,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlays.brand20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FBF8F5',
  },
  outlineButtonText: {
    color: colors.brand,
    ...typography.body,
    fontWeight: '700',
  },
  logoutCard: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#F32020',
    ...typography.body,
    fontWeight: '500',
  },
  modalBodyText: {
    color: '#677489',
    ...typography.body,
    lineHeight: 24,
  },
  modalBodyStrong: {
    color: colors.text,
    fontWeight: '700',
  },
  modalCancelButton: {
    height: 44,
    flex: 1,
    borderRadius: radius.full,
    backgroundColor: '#FBF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: overlays.brand10,
  },
  modalCancelText: {
    color: colors.text,
    ...typography.body,
    fontWeight: '500',
  },
  modalConfirmButton: {
    height: 44,
    flex: 1,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: colors.brandForeground,
    ...typography.body,
    fontWeight: '700',
  },
})
