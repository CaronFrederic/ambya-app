import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { useAdminUser, useUpdateAdminUser } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle, AdminStatCard } from '../../src/components/AdminScaffold'
import { AdminQuestionnaireSummary } from '../../src/components/admin/AdminQuestionnaireSummary'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useAdminUser(id)
  const updateUser = useUpdateAdminUser()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')

  const item = data?.item as any

  useEffect(() => {
    if (!item) return
    setEmail(item.email ?? '')
    setPhone(item.phone ?? '')
    setNickname(String(item.clientProfile?.nickname ?? ''))
    setFirstName(String(item.employeeProfile?.firstName ?? ''))
    setLastName(String(item.employeeProfile?.lastName ?? ''))
    setDisplayName(String(item.employeeProfile?.displayName ?? ''))
  }, [item])

  return (
    <Screen noPadding>
      <AdminHeader title="Fiche client" subtitle="Support, activite recente, fidelite et edition du profil" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FeedbackState title="Chargement de la fiche client" actionLabel="Rafraichir" onAction={() => void refetch()} />
        ) : isError || !item ? (
          <FeedbackState
            title="Fiche client indisponible"
            description="Impossible de charger cette fiche pour le moment."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <AdminStatCard label="RDV" value={item.analytics?.totalAppointments ?? 0} />
              <AdminStatCard label="Depense" value={`${(item.analytics?.totalSpent ?? 0).toLocaleString('fr-FR')} FCFA`} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Annulations" value={item.analytics?.cancelledAppointments ?? 0} />
              <AdminStatCard label="No-show" value={item.analytics?.noShows ?? 0} />
            </View>

            <AdminSectionTitle title="Modification rapide" />
            <Card style={styles.card}>
              <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
              <Input value={phone} onChangeText={setPhone} placeholder="Telephone" />
              <Input value={nickname} onChangeText={setNickname} placeholder="Pseudo client" />
              <Input value={firstName} onChangeText={setFirstName} placeholder="Prenom employee si applicable" />
              <Input value={lastName} onChangeText={setLastName} placeholder="Nom employee si applicable" />
              <Input value={displayName} onChangeText={setDisplayName} placeholder="Nom affiche employee" />
              <Button
                title={updateUser.isPending ? 'Enregistrement...' : 'Enregistrer'}
                onPress={async () => {
                  try {
                    await updateUser.mutateAsync({
                      id: id!,
                      email,
                      phone,
                      nickname,
                      firstName,
                      lastName,
                      displayName,
                    })
                    Alert.alert('Modifications enregistrees', 'La fiche utilisateur a ete mise a jour.')
                  } catch (error: any) {
                    Alert.alert(
                      'Mise a jour impossible',
                      error?.response?.data?.message?.[0] ??
                        error?.response?.data?.message ??
                        'Impossible de mettre a jour cet utilisateur.',
                    )
                  }
                }}
              />
            </Card>

            <AdminSectionTitle title="Compte & support" />
            <Card style={styles.card}>
              <DetailRow label="Nom affiche" value={item.displayName} />
              <DetailRow label="Role" value={formatRoleLabel(item.role)} />
              <DetailRow label="Statut" value={item.isActive ? 'Actif' : 'Inactif'} />
              <DetailRow label="Email" value={item.email} />
              <DetailRow label="Telephone" value={item.phone} />
              <DetailRow label="Derniere activite" value={item.analytics?.lastActivityAt ? new Date(item.analytics.lastActivityAt).toLocaleString('fr-FR') : 'Aucune'} />
            </Card>

            <AdminSectionTitle title="Preferences & profil enrichi" />
            <Card style={styles.card}>
              <DetailRow label="Ville" value={item.clientProfile?.city} />
              <DetailRow label="Pays" value={item.clientProfile?.country} />
              <DetailRow label="Genre" value={item.clientProfile?.gender} />
              <DetailRow label="Age" value={item.clientProfile?.ageRange} />
              <DetailRow label="Allergies" value={item.clientProfile?.allergies} />
              <DetailRow label="Commentaires" value={item.clientProfile?.comments} />
              <AdminQuestionnaireSummary
                gender={item.clientProfile?.gender}
                allergies={item.clientProfile?.allergies}
                comments={item.clientProfile?.comments}
                questionnaire={item.clientProfile?.questionnaire}
              />
            </Card>

            <AdminSectionTitle title="Fidelite" />
            <Card style={styles.card}>
              <DetailRow label="Niveau" value={item.loyalty?.tier} />
              <DetailRow label="Points actuels" value={String(item.loyalty?.currentPoints ?? 0)} />
              <DetailRow label="Points cumules" value={String(item.loyalty?.lifetimePoints ?? 0)} />
              <DetailRow label="Reduction en attente" value={String(item.loyalty?.pendingDiscountAmount ?? 0)} />
            </Card>

            <AdminSectionTitle title="Moyens de paiement" />
            <View style={styles.list}>
              {(item.paymentMethods ?? []).length === 0 ? (
                <Card style={styles.card}><Text style={styles.emptyText}>Aucun moyen de paiement enregistre.</Text></Card>
              ) : (
                (item.paymentMethods ?? []).map((method: any) => (
                  <Card key={method.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{method.label ?? method.type}</Text>
                    <Text style={styles.metaText}>{method.provider ?? 'Provider non renseigne'}</Text>
                    <Text style={styles.metaText}>{method.phone ?? method.last4 ?? 'Sans detail'}</Text>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title="Transactions recentes" />
            <View style={styles.list}>
              {(item.transactions ?? []).length === 0 ? (
                <Card style={styles.card}><Text style={styles.emptyText}>Aucune transaction disponible.</Text></Card>
              ) : (
                (item.transactions ?? []).map((transaction: any) => (
                  <Card key={transaction.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{formatTransactionStatus(transaction.status)}</Text>
                    <Text style={styles.metaText}>{transaction.serviceName ?? 'Sans service lie'}</Text>
                    <Text style={styles.metaText}>{transaction.salonName ?? 'Sans salon lie'}</Text>
                    <Text style={styles.metaText}>{`${(transaction.amount ?? 0).toLocaleString('fr-FR')} ${transaction.currency ?? 'FCFA'}`}</Text>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title="Rendez-vous recents" />
            <View style={styles.list}>
              {(item.appointments ?? []).length === 0 ? (
                <Card style={styles.card}><Text style={styles.emptyText}>Aucun rendez-vous trouve.</Text></Card>
              ) : (
                (item.appointments ?? []).map((appointment: any) => (
                  <Pressable
                    key={appointment.id}
                    onPress={() => router.push(`/(admin)/appointment-detail?id=${appointment.id}` as never)}
                  >
                    <Card style={styles.card}>
                      <Text style={styles.cardTitle}>{appointment.service?.name ?? 'Service'}</Text>
                      <Text style={styles.metaText}>{appointment.salon?.name ?? 'Salon'}</Text>
                      <Text style={styles.metaText}>{new Date(appointment.startAt).toLocaleString('fr-FR')}</Text>
                      <Text style={styles.metaText}>{formatAppointmentStatus(appointment.status)}</Text>
                    </Card>
                  </Pressable>
                ))
              )}
            </View>

            <AdminSectionTitle title="Habitudes client" />
            <Card style={styles.card}>
              <DetailRow label="Salons frequentes" value={(item.analytics?.salonsVisited ?? []).map((entry: any) => `${entry.label} (${entry.value})`).join(', ') || 'Aucun'} />
              <DetailRow label="Services les plus reserves" value={(item.analytics?.topServices ?? []).map((entry: any) => `${entry.label} (${entry.value})`).join(', ') || 'Aucun'} />
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value && String(value).trim() ? value : 'Non renseigne'}</Text>
    </View>
  )
}

function formatRoleLabel(role?: string | null) {
  switch (role) {
    case 'CLIENT':
      return 'Client'
    case 'EMPLOYEE':
      return 'Employe'
    case 'PROFESSIONAL':
      return 'Professionnel'
    case 'ADMIN':
      return 'Admin'
    default:
      return role ?? 'Utilisateur'
  }
}

function formatAppointmentStatus(status?: string | null) {
  switch (status) {
    case 'PENDING':
      return 'En attente'
    case 'CONFIRMED':
      return 'Confirme'
    case 'COMPLETED':
      return 'Termine'
    case 'CANCELLED':
      return 'Annule'
    case 'NO_SHOW':
      return 'No-show'
    default:
      return status ?? 'Inconnu'
  }
}

function formatTransactionStatus(status?: string | null) {
  switch (status) {
    case 'SUCCEEDED':
      return 'Reussie'
    case 'FAILED':
      return 'Echouee'
    case 'PENDING':
      return 'En attente'
    case 'CANCELLED':
      return 'Annulee'
    case 'CREATED':
      return 'Creee'
    default:
      return status ?? 'Transaction'
  }
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
})
