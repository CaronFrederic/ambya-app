import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import { useAdminAppointment, useUpdateAdminAppointment } from '../../src/api/admin'
import { AdminQuestionnaireSummary } from '../../src/components/admin/AdminQuestionnaireSummary'
import { AdminHeader, AdminSectionTitle } from '../../src/components/AdminScaffold'
import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { StatusPill } from '../../src/components/StatusPill'
import { EmployeeCalendarPicker } from '../../src/components/employee/EmployeeCalendarPicker'
import { EmployeeModal } from '../../src/components/employee/EmployeeModal'
import { EmployeePickerField } from '../../src/components/employee/EmployeePickerField'
import { EmployeeSelectList } from '../../src/components/employee/EmployeeSelectList'
import { EmployeeTimePicker } from '../../src/components/employee/EmployeeTimePicker'
import { requireOnlineAction } from '../../src/offline/guard'
import { useOfflineStatus } from '../../src/providers/OfflineProvider'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] as const
type PickerType = 'status' | 'employee' | 'date' | 'startTime' | 'endTime' | null

export default function AdminAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isOffline } = useOfflineStatus()
  const { data, isLoading, isError, refetch } = useAdminAppointment(id)
  const updateAppointment = useUpdateAdminAppointment()
  const item = data?.item as any

  const [activePicker, setActivePicker] = useState<PickerType>(null)
  const [status, setStatus] = useState<string>('PENDING')
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [dateValue, setDateValue] = useState('')
  const [startTimeValue, setStartTimeValue] = useState('')
  const [endTimeValue, setEndTimeValue] = useState('')
  const [note, setNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!item) return
    setStatus(item.status ?? 'PENDING')
    setEmployeeId(item.employee?.id ?? null)
    setDateValue(formatPickerDate(item.startAt))
    setStartTimeValue(formatPickerTime(item.startAt))
    setEndTimeValue(formatPickerTime(item.endAt))
    setNote(item.note ?? '')
    setFieldErrors({})
  }, [item])

  const employeeOptions = useMemo(() => {
    const options = (item?.availableEmployees ?? []).map((employee: any) => ({
      id: employee.id,
      label: employee.primarySpecialtyLabel
        ? `${employee.displayName} - ${employee.primarySpecialtyLabel}`
        : employee.displayName,
      helper:
        employee.specialties?.length > 1 ? employee.specialties.join(', ') : employee.primarySpecialtyLabel ?? null,
    }))
    return [{ id: '', label: 'Aucun employe assigne', helper: null }, ...options]
  }, [item?.availableEmployees])

  const selectedEmployeeLabel =
    employeeOptions.find((option) => option.id === (employeeId ?? ''))?.label ?? 'Choisir un employe'

  const activityLabel = item?.client?.recentAppointments?.length
    ? `Derniers rendez-vous client (${item.client.recentAppointments.length})`
    : 'Derniers rendez-vous client'

  const handleSave = async () => {
    if (!requireOnlineAction('mettre a jour un rendez-vous admin')) return

    const errors: Record<string, string> = {}
    if (!dateValue) errors.date = 'Selectionne une date.'
    if (!startTimeValue) errors.start = 'Selectionne une heure de debut.'
    if (!endTimeValue) errors.end = 'Selectionne une heure de fin.'
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    const startAt = combineDateAndTime(dateValue, startTimeValue)
    const endAt = combineDateAndTime(dateValue, endTimeValue)

    if (!startAt || !endAt || endAt <= startAt) {
      setFieldErrors({
        end: 'L heure de fin doit etre apres l heure de debut.',
      })
      return
    }

    try {
      await updateAppointment.mutateAsync({
        id: id!,
        status,
        employeeId: employeeId || null,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        note: note.trim() || null,
      })
      Alert.alert('Modifications enregistrees', 'Le rendez-vous a ete mis a jour.')
      await refetch()
    } catch (error: any) {
      Alert.alert(
        'Mise a jour impossible',
        error?.response?.data?.message?.[0] ??
          error?.response?.data?.message ??
          'Impossible de mettre a jour ce rendez-vous.',
      )
    }
  }

  return (
    <Screen noPadding>
      <AdminHeader
        title="Fiche rendez-vous"
        subtitle="Vue support et correction guidee"
        back
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FeedbackState
            title="Chargement du rendez-vous"
            description="Nous recuperons les informations utiles au support."
            actionLabel="Rafraichir"
            onAction={() => void refetch()}
          />
        ) : isError || !item ? (
          <FeedbackState
            title="Fiche rendez-vous indisponible"
            description="Impossible de charger ce rendez-vous pour le moment."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : (
          <>
            <Card style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.heroIdentity}>
                  <Text style={styles.heroTitle}>{item.client?.name ?? 'Client'}</Text>
                  <Text style={styles.heroSubtitle}>{item.service?.name ?? 'Service'}</Text>
                </View>
                <StatusPill label={getStatusLabel(item.status)} tone={getStatusTone(item.status)} />
              </View>

              <View style={styles.metaStack}>
                <Text style={styles.metaText}>{formatDateTime(item.startAt)}</Text>
                <Text style={styles.metaText}>{item.salon?.name ?? 'Salon'}</Text>
                <Text style={styles.metaText}>
                  {item.payment
                    ? `${(item.payment.amount ?? 0).toLocaleString('fr-FR')} ${item.payment.currency ?? 'FCFA'}`
                    : 'Paiement non renseigne'}
                </Text>
              </View>
            </Card>

            <AdminSectionTitle title="Contexte de la prestation" />
            <Card style={styles.card}>
              <DetailRow label="Salon" value={item.salon?.name} />
              <DetailRow
                label="Adresse"
                value={[item.salon?.address, item.salon?.city, item.salon?.country].filter(Boolean).join(', ')}
              />
              <DetailRow label="Service" value={item.service?.name} />
              <DetailRow label="Categorie" value={item.service?.category} />
              <DetailRow
                label="Employe assigne"
                value={
                  item.employee?.displayName
                    ? [item.employee.displayName, item.employee.primarySpecialtyLabel].filter(Boolean).join(' - ')
                    : 'Aucun employe assigne'
                }
              />
              <DetailRow label="Note de prestation" value={item.note} />
            </Card>

            <AdminSectionTitle title="Client et profil utile" />
            <Card style={styles.card}>
              <DetailRow label="Nom" value={item.client?.name} />
              <DetailRow label="Email" value={item.client?.email} />
              <DetailRow label="Telephone" value={item.client?.phone} />
              <DetailRow
                label="Compte cree le"
                value={item.client?.createdAt ? formatDateTime(item.client.createdAt) : null}
              />
              <AdminQuestionnaireSummary
                gender={item.client?.profile?.gender}
                allergies={item.client?.profile?.allergies}
                comments={item.client?.profile?.comments}
                questionnaire={item.client?.profile?.questionnaire}
              />
            </Card>

            <AdminSectionTitle title="Paiement et fidelite" />
            <Card style={styles.card}>
              <DetailRow label="Statut paiement" value={item.payment?.status} />
              <DetailRow
                label="Montant"
                value={
                  item.payment
                    ? `${(item.payment.amount ?? 0).toLocaleString('fr-FR')} ${item.payment.currency ?? 'FCFA'}`
                    : null
                }
              />
              <DetailRow label="Niveau fidelite" value={item.client?.loyalty?.tier} />
              <DetailRow label="Points fidelite" value={String(item.client?.loyalty?.currentPoints ?? 0)} />
            </Card>

            <AdminSectionTitle title={activityLabel} />
            <View style={styles.list}>
              {(item.client?.recentAppointments ?? []).length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucun autre rendez-vous recent pour ce client.</Text>
                </Card>
              ) : (
                (item.client?.recentAppointments ?? []).map((appointment: any) => (
                  <Card key={appointment.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{appointment.serviceName}</Text>
                    <Text style={styles.metaText}>{appointment.salonName}</Text>
                    <Text style={styles.metaText}>{formatDateTime(appointment.startAt)}</Text>
                    <Text style={styles.metaText}>{getStatusLabel(appointment.status)}</Text>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title={`Paiements recents (${(item.payments ?? []).length})`} />
            <View style={styles.list}>
              {(item.payments ?? []).length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Aucun paiement recent sur ce rendez-vous.</Text>
                </Card>
              ) : (
                (item.payments ?? []).map((payment: any) => (
                  <Card key={payment.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{payment.status}</Text>
                    <Text style={styles.metaText}>{payment.provider ?? 'Provider non renseigne'}</Text>
                    <Text style={styles.metaText}>
                      {(payment.amount ?? 0).toLocaleString('fr-FR')} {payment.currency ?? 'FCFA'}
                    </Text>
                    <Text style={styles.metaText}>{formatDateTime(payment.createdAt)}</Text>
                  </Card>
                ))
              )}
            </View>

            <AdminSectionTitle title="Correction admin" />
            <Card style={styles.card}>
              <Text style={styles.helperText}>
                Utilise les selections guidees pour limiter les erreurs de support.
              </Text>

              <EmployeePickerField
                label="Statut du rendez-vous"
                value={getStatusLabel(status)}
                placeholder="Selectionner un statut"
                onPress={() => setActivePicker('status')}
              />

              <EmployeePickerField
                label="Employe assigne"
                value={selectedEmployeeLabel}
                placeholder="Selectionner un employe"
                onPress={() => setActivePicker('employee')}
              />

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <EmployeePickerField
                    label="Date"
                    value={dateValue}
                    placeholder="Choisir une date"
                    onPress={() => setActivePicker('date')}
                    error={fieldErrors.date}
                  />
                </View>
                <View style={styles.timeCol}>
                  <EmployeePickerField
                    label="Debut"
                    value={startTimeValue}
                    placeholder="Heure debut"
                    onPress={() => setActivePicker('startTime')}
                    error={fieldErrors.start}
                  />
                </View>
                <View style={styles.timeCol}>
                  <EmployeePickerField
                    label="Fin"
                    value={endTimeValue}
                    placeholder="Heure fin"
                    onPress={() => setActivePicker('endTime')}
                    error={fieldErrors.end}
                  />
                </View>
              </View>

              <Input
                value={note}
                onChangeText={setNote}
                placeholder="Note support ou note de prestation"
                multiline
                numberOfLines={4}
              />

              <Button
                title={updateAppointment.isPending ? 'Enregistrement...' : 'Enregistrer les corrections'}
                onPress={() => void handleSave()}
                disabled={updateAppointment.isPending || isOffline}
              />
            </Card>
          </>
        )}
      </ScrollView>

      <EmployeeModal
        visible={activePicker === 'status'}
        title="Choisir un statut"
        onClose={() => setActivePicker(null)}
      >
        <EmployeeSelectList
          options={STATUS_OPTIONS.map((entry) => getStatusLabel(entry))}
          value={getStatusLabel(status)}
          placeholder="Selectionner un statut"
          onSelect={(label) => {
            const next = STATUS_OPTIONS.find((entry) => getStatusLabel(entry) === label)
            if (next) setStatus(next)
            setActivePicker(null)
          }}
        />
      </EmployeeModal>

      <EmployeeModal
        visible={activePicker === 'employee'}
        title="Assigner un employe"
        onClose={() => setActivePicker(null)}
      >
        <View style={styles.modalList}>
          {employeeOptions.map((option) => {
            const active = (employeeId ?? '') === option.id
            return (
              <Pressable
                key={option.id || 'none'}
                onPress={() => {
                  setEmployeeId(option.id || null)
                  setActivePicker(null)
                }}
                style={[styles.choiceRow, active && styles.choiceRowActive]}
              >
                <Text style={[styles.choiceTitle, active && styles.choiceTitleActive]}>{option.label}</Text>
                {option.helper ? <Text style={styles.choiceHelper}>{option.helper}</Text> : null}
              </Pressable>
            )
          })}
        </View>
      </EmployeeModal>

      <EmployeeModal
        visible={activePicker === 'date'}
        title="Choisir une date"
        onClose={() => setActivePicker(null)}
      >
        <EmployeeCalendarPicker
          value={dateValue}
          onChange={(value) => {
            setDateValue(value)
            setActivePicker(null)
          }}
          onClear={() => setDateValue('')}
        />
      </EmployeeModal>

      <EmployeeModal
        visible={activePicker === 'startTime'}
        title="Heure de debut"
        onClose={() => setActivePicker(null)}
      >
        <EmployeeTimePicker
          value={startTimeValue || '09:00'}
          onChange={(value) => {
            setStartTimeValue(value)
            setActivePicker(null)
          }}
        />
      </EmployeeModal>

      <EmployeeModal
        visible={activePicker === 'endTime'}
        title="Heure de fin"
        onClose={() => setActivePicker(null)}
      >
        <EmployeeTimePicker
          value={endTimeValue || '10:00'}
          onChange={(value) => {
            setEndTimeValue(value)
            setActivePicker(null)
          }}
        />
      </EmployeeModal>
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

function formatDateTime(value?: string | null) {
  if (!value) return 'Non renseigne'
  return new Date(value).toLocaleString('fr-FR')
}

function formatPickerDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function formatPickerTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  const [day, month, year] = dateValue.split('/').map(Number)
  const [hours, minutes] = timeValue.split(':').map(Number)
  if (!day || !month || !year || Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case 'PENDING':
      return 'En attente'
    case 'CONFIRMED':
      return 'Confirme'
    case 'COMPLETED':
      return 'Termine'
    case 'NO_SHOW':
      return 'No-show'
    case 'CANCELLED':
      return 'Annule'
    default:
      return status ?? 'Inconnu'
  }
}

function getStatusTone(status?: string | null): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'COMPLETED':
    case 'CONFIRMED':
      return 'success'
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'danger'
    default:
      return 'warning'
  }
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  list: {
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radius.xl,
    gap: spacing.md,
    backgroundColor: '#FFF8FA',
    borderColor: 'rgba(107,39,55,0.10)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroIdentity: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  metaStack: {
    gap: spacing.xs,
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
  card: {
    borderRadius: radius.xl,
    gap: spacing.md,
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
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeCol: {
    flex: 1,
  },
  modalList: {
    gap: spacing.sm,
  },
  choiceRow: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  choiceRowActive: {
    borderColor: colors.brand,
    backgroundColor: '#FBF3F5',
  },
  choiceTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  choiceTitleActive: {
    color: colors.brand,
  },
  choiceHelper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
})
