import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import { useAdminAccount, useUpdateAdmin } from '../../src/api/admin'
import { AdminHeader } from '../../src/components/AdminScaffold'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'

export default function AdminDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useAdminAccount(id)
  const updateAdmin = useUpdateAdmin()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const item = data?.item
    if (!item) return
    setEmail(item.email ?? '')
    setPhone(item.phone ?? '')
    setFirstName(item.firstName ?? '')
    setLastName(item.lastName ?? '')
    setNotes(item.notes ?? '')
  }, [data])

  return (
    <Screen noPadding>
      <AdminHeader title="Detail admin" subtitle="Edition du compte administrateur" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FeedbackState title="Chargement du compte admin" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError || !data ? (
          <FeedbackState
            title="Compte admin indisponible"
            description="Impossible de charger ce compte pour le moment."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : (
          <Card style={styles.card}>
            <Input value={firstName} onChangeText={setFirstName} placeholder="Prenom" />
            <Input value={lastName} onChangeText={setLastName} placeholder="Nom" />
            <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
            <Input value={phone} onChangeText={setPhone} placeholder="Telephone" />
            <Input value={notes} onChangeText={setNotes} placeholder="Notes" />
            <Button
              title={updateAdmin.isPending ? 'Enregistrement...' : 'Enregistrer'}
              onPress={async () => {
                try {
                  await updateAdmin.mutateAsync({ id: id!, firstName, lastName, email, phone, notes })
                  Alert.alert('Modifications enregistrees', 'Le compte admin a ete mis a jour.')
                } catch (error: any) {
                  Alert.alert(
                    'Mise a jour impossible',
                    error?.response?.data?.message?.[0] ??
                      error?.response?.data?.message ??
                      'Impossible de mettre a jour ce compte admin.',
                  )
                }
              }}
            />
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: radius.xl,
    gap: spacing.md,
  },
})
