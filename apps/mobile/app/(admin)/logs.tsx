import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useAdminAuditLogs } from '../../src/api/admin'
import { AdminHeader, AdminSectionTitle } from '../../src/components/AdminScaffold'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

const ACTION_SUGGESTIONS = ['create', 'update', 'delete', 'cancel', 'confirm', 'complete', 'pay']
const ENTITY_SUGGESTIONS = ['user', 'client_profile', 'employee', 'appointment', 'payment_intent', 'admin']
const ACTION_LABELS: Record<string, string> = {
  create: 'Creation',
  update: 'Mise a jour',
  delete: 'Suppression',
  cancel: 'Annulation',
  confirm: 'Confirmation',
  complete: 'Completion',
  pay: 'Encaissement',
}
const ENTITY_LABELS: Record<string, string> = {
  user: 'Utilisateur',
  client_profile: 'Profil client',
  employee: 'Employe',
  appointment: 'Rendez-vous',
  payment_intent: 'Transaction',
  admin: 'Admin',
}

export default function AdminLogsScreen() {
  const [actionType, setActionType] = useState('')
  const [entityType, setEntityType] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useAdminAuditLogs({
    actionType: actionType || undefined,
    entityType: entityType || undefined,
    actorUserId: actorUserId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const items = useMemo(() => data?.items ?? [], [data?.items])

  return (
    <Screen noPadding>
      <AdminHeader title="Audit logs" subtitle="Historique centralise des actions sensibles" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AdminSectionTitle title="Filtres rapides" />
        <View style={styles.filterWrap}>
          <View style={styles.chipsRow}>
            {ACTION_SUGGESTIONS.map((item) => {
              const active = actionType === item
              return (
                <FilterChip
                  key={item}
                  label={ACTION_LABELS[item] ?? item}
                  active={active}
                  onPress={() => setActionType(active ? '' : item)}
                />
              )
            })}
          </View>
          <View style={styles.chipsRow}>
            {ENTITY_SUGGESTIONS.map((item) => {
              const active = entityType === item
              return (
                <FilterChip
                  key={item}
                  label={ENTITY_LABELS[item] ?? item}
                  active={active}
                  onPress={() => setEntityType(active ? '' : item)}
                />
              )
            })}
          </View>
        </View>

        <Input value={actorUserId} onChangeText={setActorUserId} placeholder="Filtrer par utilisateur (ID acteur)" />
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Input value={dateFrom} onChangeText={setDateFrom} placeholder="Date debut (YYYY-MM-DD)" />
          </View>
          <View style={styles.dateCol}>
            <Input value={dateTo} onChangeText={setDateTo} placeholder="Date fin (YYYY-MM-DD)" />
          </View>
        </View>

        <AdminSectionTitle title={`Logs (${data?.total ?? 0})`} />
        {isLoading ? (
          <FeedbackState
            title="Chargement des logs"
            description="Nous recuperons les actions les plus sensibles."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : isError ? (
          <FeedbackState
            title="Impossible de charger les logs"
            description="Verifie les filtres ou reessaie dans un instant."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <FeedbackState
            title="Aucun log trouve"
            description="Essaie d assouplir les filtres pour retrouver une action."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => {
              const expanded = expandedId === item.id
              const changes = buildFieldChanges(item.oldValue, item.newValue)
              return (
                <Pressable key={item.id} onPress={() => setExpandedId(expanded ? null : item.id)}>
                  <Card style={styles.card}>
                    <View style={styles.headerRow}>
                      <View style={styles.headerTextWrap}>
                        <Text style={styles.title}>{formatActionLabel(item.actionType)}</Text>
                        <Text style={styles.meta}>
                          {formatEntityLabel(item.entityType)}
                          {item.entityId ? ` - ${item.entityId}` : ''}
                        </Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{formatActorRole(item.actorRole)}</Text>
                      </View>
                    </View>

                    <Text style={styles.meta}>
                      Acteur: {item.actorUserId ?? 'Systeme'}
                      {item.actorAdminScope ? ` - scope ${formatActorScope(item.actorAdminScope)}` : ''}
                    </Text>
                    <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString('fr-FR')}</Text>

                    {expanded ? (
                      <View style={styles.details}>
                        <DetailBlock
                          title="Champs modifies"
                          emptyLabel="Aucune difference exploitable a afficher."
                          rows={changes}
                        />
                        <DetailBlock
                          title="Metadata"
                          emptyLabel="Aucune metadata disponible."
                          rows={toDisplayRows(item.metadata)}
                        />
                        <DetailBlock
                          title="Valeur precedente"
                          emptyLabel="Pas de valeur precedente."
                          rows={toDisplayRows(item.oldValue)}
                        />
                        <DetailBlock
                          title="Nouvelle valeur"
                          emptyLabel="Pas de nouvelle valeur."
                          rows={toDisplayRows(item.newValue)}
                        />
                        <Text style={styles.routeText}>
                          {item.method ?? 'N/A'} - {item.route ?? 'Route inconnue'}
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                </Pressable>
              )
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  )
}

function DetailBlock({
  title,
  rows,
  emptyLabel,
}: {
  title: string
  rows: Array<{ label: string; value: string }>
  emptyLabel: string
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.detailTitle}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyBlockText}>{emptyLabel}</Text>
      ) : (
        rows.map((row) => (
          <View key={`${title}-${row.label}`} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))
      )}
    </View>
  )
}

function buildFieldChanges(oldValue: unknown, newValue: unknown) {
  const before = flattenObject(oldValue)
  const after = flattenObject(newValue)
  const labels = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort()

  return labels
    .filter((label) => before[label] !== after[label])
    .map((label) => ({
      label,
      value: `${before[label] ?? 'vide'} -> ${after[label] ?? 'vide'}`,
    }))
}

function toDisplayRows(value: unknown) {
  const rows = flattenObject(value)
  return Object.entries(rows).map(([label, rowValue]) => ({
    label,
    value: rowValue,
  }))
}

function flattenObject(value: unknown, prefix = ''): Record<string, string> {
  if (value === null || value === undefined) return {}
  if (typeof value !== 'object') {
    return { [prefix || 'value']: formatScalar(value) }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { [prefix || 'value']: '[]' }
    return value.reduce<Record<string, string>>((acc, item, index) => {
      Object.assign(acc, flattenObject(item, `${prefix}[${index}]`))
      return acc
    }, {})
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, entry]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    if (entry !== null && typeof entry === 'object') {
      Object.assign(acc, flattenObject(entry, nextPrefix))
    } else {
      acc[nextPrefix] = formatScalar(entry)
    }
    return acc
  }, {})
}

function formatScalar(value: unknown) {
  if (value === null || value === undefined || value === '') return 'vide'
  if (typeof value === 'boolean') return value ? 'oui' : 'non'
  return String(value)
}

function formatActionLabel(actionType: string) {
  return actionType
    .split('.')
    .map((part) => ACTION_LABELS[part] ?? part.replace(/_/g, ' '))
    .join(' / ')
}

function formatEntityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] ?? entityType.replace(/_/g, ' ')
}

function formatActorRole(role: string | null) {
  if (!role) return 'Role inconnu'
  if (role === 'ADMIN') return 'Admin'
  if (role === 'CLIENT') return 'Client'
  if (role === 'EMPLOYEE') return 'Employe'
  if (role === 'PROFESSIONAL') return 'Professionnel'
  return role
}

function formatActorScope(scope: string) {
  return scope.replace(/_/g, ' ').toLowerCase()
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  filterWrap: {
    gap: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipActive: {
    borderColor: colors.brand,
    backgroundColor: '#FBF3F5',
  },
  filterChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.brand,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateCol: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    borderRadius: radius.full,
    backgroundColor: '#FBF3F5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  details: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  block: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FCF8F9',
  },
  detailTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyBlockText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  rowValue: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  routeText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
})
