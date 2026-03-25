import React from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useQueryClient } from '@tanstack/react-query'

import { Screen } from '../../src/components/Screen'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { AdminHeader, AdminSectionTitle, AdminStatCard } from '../../src/components/AdminScaffold'
import { useAdminDashboard } from '../../src/api/admin'
import { useAuthRefresh } from '../../src/providers/AuthRefreshProvider'
import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'

function formatMoney(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`
}

function formatStatusLabel(value: string) {
  switch (value) {
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
      return value.replace(/_/g, ' ').toLowerCase()
  }
}

function formatLogAction(value: string) {
  if (value.includes('create')) return 'Creation'
  if (value.includes('update')) return 'Mise a jour'
  if (value.includes('delete')) return 'Suppression'
  if (value.includes('status')) return 'Changement de statut'
  return value
}

function formatLogEntity(value: string) {
  switch (value) {
    case 'user':
      return 'Utilisateur'
    case 'client_profile':
      return 'Profil client'
    case 'employee_profile':
      return 'Profil employee'
    case 'appointment':
      return 'Rendez-vous'
    case 'salon':
      return 'Salon'
    case 'admin':
      return 'Admin'
    default:
      return value
  }
}

export default function AdminDashboardScreen() {
  const { data, isLoading, isError, refetch } = useAdminDashboard()
  const { refreshAuth } = useAuthRefresh()
  const queryClient = useQueryClient()

  const onLogout = () => {
    Alert.alert('Deconnexion', "Voulez-vous vous deconnecter de l'espace Admin ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se deconnecter',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('accessToken')
          await SecureStore.deleteItemAsync('userRole')
          queryClient.clear()
          await refreshAuth()
          router.replace('/(auth)/login' as never)
        },
      },
    ])
  }

  return (
    <Screen noPadding>
      <AdminHeader
        title="Admin AMBYA"
        subtitle="Pilotage business, support utilisateur et administration"
        rightLabel="Deconnexion"
        onRightPress={onLogout}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FeedbackState
            title="Chargement du dashboard"
            description="Nous recuperons les indicateurs admin."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : isError || !data ? (
          <FeedbackState
            title="Dashboard indisponible"
            description="Impossible de charger les indicateurs pour le moment."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : (
          <>
            <AdminSectionTitle title="Vue d'ensemble" />
            <View style={styles.statsGrid}>
              <AdminStatCard label="Clients" value={data.overview.totalClients} />
              <AdminStatCard label="Salons" value={data.overview.totalSalons} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Employes" value={data.overview.totalEmployees} />
              <AdminStatCard label="Nouveaux 30j" value={data.overview.newUsers30d} />
            </View>

            <AdminSectionTitle title="Pilotage financier" />
            <View style={styles.statsGrid}>
              <AdminStatCard label="Cashflow global" value={formatMoney(data.finance.cashflowGlobal)} />
              <AdminStatCard label="Revenu AMBYA" value={formatMoney(data.finance.ambyaRevenue)} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="% AMBYA" value={`${data.finance.ambyaRevenueSharePct}%`} />
              <AdminStatCard label="Panier moyen" value={formatMoney(data.finance.averageBasket)} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="CA semaine" value={formatMoney(data.finance.revenueWeek)} />
              <AdminStatCard label="CA mois" value={formatMoney(data.finance.revenueMonth)} />
            </View>

            <AdminSectionTitle
              title="Rendez-vous"
              actionLabel="Tout voir"
              onAction={() => router.push('/(admin)/appointments' as never)}
            />
            <View style={styles.statsGrid}>
              <AdminStatCard label="Total RDV" value={data.appointments.total} />
              <AdminStatCard label="Aujourd'hui" value={data.appointments.today} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Taux confirmation" value={`${data.appointments.confirmationRate}%`} />
              <AdminStatCard label="Taux completion" value={`${data.appointments.completionRate}%`} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Taux annulation" value={`${data.appointments.cancellationRate}%`} />
              <AdminStatCard label="Taux no-show" value={`${data.appointments.noShowRate}%`} />
            </View>

            <AdminSectionTitle title="Paiements" />
            <View style={styles.statsGrid}>
              <AdminStatCard label="Transactions" value={data.payments.totalTransactions} />
              <AdminStatCard label="Taux succes" value={`${data.payments.successRate}%`} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Reussies" value={data.payments.successful} />
              <AdminStatCard label="Problemes" value={data.payments.problematicTransactions} />
            </View>

            <AdminSectionTitle title="Activite & fidelite" />
            <View style={styles.statsGrid}>
              <AdminStatCard label="Clients actifs 30j" value={data.overview.activeClients30d} />
              <AdminStatCard label="Clients recurrents" value={data.overview.recurrentClients} />
            </View>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Fidelite active" value={data.loyalty.activeAccounts} />
              <AdminStatCard label="Salons inactifs" value={data.overview.inactiveSalons} />
            </View>

            <AdminSectionTitle title="Support prioritaire" />
            <View style={styles.quickGrid}>
              {data.support.alerts.map((item) => (
                <Card key={item.label} style={styles.alertCard}>
                  <Text style={styles.alertCount}>{item.count}</Text>
                  <Text style={styles.alertLabel}>{item.label}</Text>
                </Card>
              ))}
            </View>

            <AdminSectionTitle title="Acces rapides" />
            <View style={styles.quickGrid}>
              {[
                ['Utilisateurs', '/(admin)/users'],
                ['Salons', '/(admin)/salons'],
                ['Rendez-vous', '/(admin)/appointments'],
                ['Admins', '/(admin)/admins'],
                ['Audit logs', '/(admin)/logs'],
              ].map(([label, path]) => (
                <Pressable
                  key={label}
                  onPress={() => router.push(path as never)}
                  style={styles.quickCard}
                >
                  <Text style={styles.quickTitle}>{label}</Text>
                  <Text style={styles.quickSubtitle}>Explorer et agir rapidement</Text>
                </Pressable>
              ))}
            </View>

            <AdminSectionTitle title="Top salons par revenu" />
            <View style={styles.stack}>
              {data.finance.topSalonsByRevenue.map((item, index) => (
                <Card key={item.label} style={styles.listCard}>
                  <Text style={styles.listTitle}>{`${index + 1}. ${item.label}`}</Text>
                  <Text style={styles.listMeta}>{formatMoney(item.value)}</Text>
                </Card>
              ))}
            </View>

            <AdminSectionTitle title="Top services par revenu" />
            <View style={styles.stack}>
              {data.finance.topServicesByRevenue.map((item, index) => (
                <Card key={item.label} style={styles.listCard}>
                  <Text style={styles.listTitle}>{`${index + 1}. ${item.label}`}</Text>
                  <Text style={styles.listMeta}>{formatMoney(item.value)}</Text>
                </Card>
              ))}
            </View>

            <AdminSectionTitle title="Repartition des rendez-vous" />
            <View style={styles.stack}>
              {Object.entries(data.appointments.byStatus).map(([label, value]) => (
                <Card key={label} style={styles.listCard}>
                  <Text style={styles.listTitle}>{formatStatusLabel(label)}</Text>
                  <Text style={styles.listMeta}>{value} rendez-vous</Text>
                </Card>
              ))}
            </View>

            <AdminSectionTitle title="Transactions par provider" />
            <View style={styles.stack}>
              {data.payments.byProvider.map((item) => (
                <Card key={item.label} style={styles.listCard}>
                  <Text style={styles.listTitle}>{item.label}</Text>
                  <Text style={styles.listMeta}>{item.value} transaction(s)</Text>
                </Card>
              ))}
            </View>

            <AdminSectionTitle title="Rendez-vous recents" />
            <View style={styles.stack}>
              {data.recentAppointments.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/(admin)/appointment-detail?id=${item.id}` as never)}
                >
                  <Card style={styles.listCard}>
                    <Text style={styles.listTitle}>{item.clientName}</Text>
                    <Text style={styles.listMeta}>{item.serviceName}</Text>
                    <Text style={styles.listMeta}>{item.salonName}</Text>
                    <Text style={styles.badge}>{formatStatusLabel(item.status)}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>

            <AdminSectionTitle
              title="Dernieres actions"
              actionLabel="Tout voir"
              onAction={() => router.push('/(admin)/logs' as never)}
            />
            <View style={styles.stack}>
              {data.support.recentLogs.map((item) => (
                <Card key={item.id} style={styles.listCard}>
                  <Text style={styles.listTitle}>{formatLogAction(item.actionType)}</Text>
                  <Text style={styles.listMeta}>
                    {formatLogEntity(item.entityType)}
                    {item.entityId ? ` - ${item.entityId}` : ''}
                  </Text>
                  <Text style={styles.listMeta}>{new Date(item.createdAt).toLocaleString('fr-FR')}</Text>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  )
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickCard: {
    width: '48%',
    minHeight: 110,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  quickTitle: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: '800',
  },
  quickSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  alertCard: {
    width: '48%',
    borderRadius: radius.xl,
    backgroundColor: '#FFF9FB',
    borderColor: overlays.brand20,
  },
  alertCount: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: '800',
  },
  alertLabel: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  stack: {
    gap: spacing.md,
  },
  listCard: {
    borderRadius: radius.xl,
  },
  listTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  listMeta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  badge: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: '#FBF3F5',
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
  },
})
