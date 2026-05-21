import React, { useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { FeedbackState } from '../../src/components/FeedbackState'
import { InfoHint } from '../../src/components/InfoHint'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { EmployeeCalendarPicker } from '../../src/components/employee/EmployeeCalendarPicker'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { EmployeeModal } from '../../src/components/employee/EmployeeModal'
import { EmployeePickerField } from '../../src/components/employee/EmployeePickerField'
import { EmployeeSelectList } from '../../src/components/employee/EmployeeSelectList'
import {
  useCancelEmployeeLeaveRequest,
  useCreateEmployeeLeaveRequest,
  useEmployeeLeaveRequests,
  useUpdateEmployeeLeaveRequest,
} from '../../src/api/employee-portal'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'
import { useOfflineStatus } from '../../src/providers/OfflineProvider'
import { requireOnlineAction } from '../../src/offline/guard'

type PickerType = 'start' | 'end' | 'type' | null

const LEAVE_TYPES = [
  'Vacances',
  'Arrêt maladie',
  'Événement familial',
  'Raison administrative',
  'Formation',
  'Autre',
] as const

function buildLeaveReason(type: string, details: string) {
  if (type === 'Autre') return details.trim()
  return details.trim() ? `${type} - ${details.trim()}` : type
}

function parseLeaveReason(reason: string) {
  const matchedType =
    LEAVE_TYPES.find((type) => reason === type || reason.startsWith(`${type} - `)) ??
    'Autre'

  if (matchedType === 'Autre') {
    return { leaveType: 'Autre', details: reason }
  }

  const details = reason.replace(`${matchedType} - `, '').trim()
  return {
    leaveType: matchedType,
    details: details === matchedType ? '' : details,
  }
}

export default function EmployeeLeaveScreen() {
  const leaveRequests = useEmployeeLeaveRequests()
  const createLeaveRequest = useCreateEmployeeLeaveRequest()
  const updateLeaveRequest = useUpdateEmployeeLeaveRequest()
  const cancelLeaveRequest = useCancelEmployeeLeaveRequest()
  const { isOffline } = useOfflineStatus()
  const [showModal, setShowModal] = useState(false)
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveType, setLeaveType] = useState<string>('')
  const [reasonDetails, setReasonDetails] = useState('')
  const [activePicker, setActivePicker] = useState<PickerType>(null)
  const [errors, setErrors] = useState<{
    startDate?: string
    endDate?: string
    leaveType?: string
    reasonDetails?: string
  }>({})

  const reasonPreview = useMemo(
    () => buildLeaveReason(leaveType, reasonDetails),
    [leaveType, reasonDetails],
  )

  const closeModal = () => {
    setShowModal(false)
    setEditingLeaveId(null)
    setStartDate('')
    setEndDate('')
    setLeaveType('')
    setReasonDetails('')
    setActivePicker(null)
    setErrors({})
  }

  const validateForm = () => {
    const nextErrors: {
      startDate?: string
      endDate?: string
      leaveType?: string
      reasonDetails?: string
    } = {}

    if (!isValidDateValue(startDate)) {
      nextErrors.startDate = 'Sélectionnez une date de début valide.'
    }

    if (!isValidDateValue(endDate)) {
      nextErrors.endDate = 'Sélectionnez une date de fin valide.'
    }

    if (isValidDateValue(startDate) && isValidDateValue(endDate) && compareDates(startDate, endDate) > 0) {
      nextErrors.endDate = 'La date de fin doit être après la date de début.'
    }

    if (!leaveType) {
      nextErrors.leaveType = 'Sélectionnez un type de congé.'
    }

    if (leaveType === 'Autre' && !reasonDetails.trim()) {
      nextErrors.reasonDetails = 'Précisez le motif de votre demande.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!requireOnlineAction(editingLeaveId ? 'modifier une demande de congé' : 'envoyer une demande de congé')) return
    if (!validateForm()) return

    try {
      const payload = {
        startAt: toStartOfDayIso(startDate),
        endAt: toEndOfDayIso(endDate),
        reason: buildLeaveReason(leaveType, reasonDetails),
      }

      if (editingLeaveId) {
        await updateLeaveRequest.mutateAsync({
          id: editingLeaveId,
          ...payload,
        })
      } else {
        await createLeaveRequest.mutateAsync(payload)
      }
      closeModal()
      Alert.alert(
        editingLeaveId ? 'Demande modifiée' : 'Demande envoyée',
        editingLeaveId
          ? 'Votre demande de congé a bien été mise à jour.'
          : 'Votre demande de congé a bien été enregistrée.',
      )
    } catch (error: any) {
      Alert.alert(
        editingLeaveId ? 'Impossible de modifier la demande' : "Impossible d'envoyer la demande",
        error?.message ?? 'Erreur inconnue',
      )
    }
  }

  const openCreateModal = () => {
    closeModal()
    setShowModal(true)
  }

  const openEditModal = (leave: { id: string; startAt: string; endAt: string; reason: string }) => {
    const parsed = parseLeaveReason(leave.reason)
    setEditingLeaveId(leave.id)
    setStartDate(toDateInputValue(leave.startAt))
    setEndDate(toDateInputValue(leave.endAt))
    setLeaveType(parsed.leaveType)
    setReasonDetails(parsed.leaveType === 'Autre' ? parsed.details : parsed.details)
    setErrors({})
    setActivePicker(null)
    setShowModal(true)
  }

  const handleCancelLeave = (leaveId: string) => {
    if (!requireOnlineAction('annuler une demande de congé')) return
    Alert.alert(
      'Annuler cette demande',
      'Cette demande en attente sera supprimée.',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la demande',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelLeaveRequest.mutateAsync({ id: leaveId })
              Alert.alert('Demande annulée', 'La demande de congé a bien été annulée.')
            } catch (error: any) {
              Alert.alert('Action impossible', error?.message ?? 'Erreur inconnue')
            }
          },
        },
      ],
    )
  }

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader title="Demandes de congé" subtitle="Gérez vos congés" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <View style={styles.titleRow}>
          <Button
            title="Nouvelle demande"
            onPress={openCreateModal}
            style={styles.newRequestButton}
            disabled={isOffline}
          />
          <InfoHint text="Permet de créer une nouvelle demande de congé à soumettre au salon." />
        </View>

        <View style={styles.list}>
          {leaveRequests.isLoading ? (
            <FeedbackState
              icon="time-outline"
              title="Chargement des demandes"
              description="Vos demandes de congé arrivent."
            />
          ) : leaveRequests.isError ? (
            <FeedbackState
              icon="alert-circle-outline"
              title="Impossible de charger les congés"
              description="Réessayez dans un instant."
              actionLabel="Réessayer"
              onAction={() => void leaveRequests.refetch()}
            />
          ) : (leaveRequests.data?.items.length ?? 0) === 0 ? (
            <FeedbackState
              icon="document-text-outline"
              title="Aucune demande de congé"
              description="Vos futures demandes apparaîtront ici."
            />
          ) : (
            leaveRequests.data?.items.map((leave) => (
              <Card key={leave.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>{leave.reason}</Text>
                    {leave.status === 'PENDING' ? (
                      <InfoHint text="Demande envoyée, en attente de validation." />
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      leave.status === 'APPROVED'
                        ? styles.approvedPill
                        : leave.status === 'REJECTED'
                          ? styles.rejectedPill
                          : styles.pendingPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        leave.status === 'APPROVED'
                          ? styles.approvedText
                          : leave.status === 'REJECTED'
                            ? styles.rejectedText
                            : styles.pendingText,
                      ]}
                    >
                      {leave.status === 'APPROVED'
                        ? 'Approuvé'
                        : leave.status === 'REJECTED'
                          ? 'Refusé'
                          : 'En attente'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.period}>
                  Du {formatDate(leave.startAt)} au {formatDate(leave.endAt)}
                </Text>
                <View style={styles.separator} />
                <Text style={styles.duration}>{buildDurationLabel(leave.startAt, leave.endAt)}</Text>
                {leave.managerNote ? <Text style={styles.managerNote}>Note manager : {leave.managerNote}</Text> : null}
                {leave.status === 'PENDING' ? (
                  <View style={styles.cardActions}>
                    <Button
                      title="Modifier"
                      variant="outline"
                      onPress={() => openEditModal(leave)}
                      style={styles.cardActionButton}
                    />
                    <Button
                      title="Annuler"
                      variant="secondary"
                      onPress={() => handleCancelLeave(leave.id)}
                      style={styles.cardActionButton}
                    />
                  </View>
                ) : null}
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <EmployeeModal
        visible={showModal}
        title={editingLeaveId ? 'Modifier la demande' : 'Nouvelle demande de congé'}
        onClose={closeModal}
        footer={
          <>
            <Button title="Annuler" variant="secondary" onPress={closeModal} style={styles.footerButton} />
            <Button
              title={
                createLeaveRequest.isPending || updateLeaveRequest.isPending
                  ? 'Enregistrement...'
                  : editingLeaveId
                    ? 'Mettre à jour'
                    : 'Envoyer'
              }
              onPress={handleSubmit}
              style={styles.footerButton}
              disabled={isOffline || createLeaveRequest.isPending || updateLeaveRequest.isPending}
            />
          </>
        }
      >
        <EmployeePickerField
          label="Date de début"
          placeholder="jj/mm/aaaa"
          value={startDate}
          onPress={() => setActivePicker((current) => (current === 'start' ? null : 'start'))}
          icon="calendar-outline"
          error={errors.startDate}
        />
        {activePicker === 'start' ? (
          <EmployeeCalendarPicker
            value={startDate}
            onChange={(date) => {
              setStartDate(date)
              setActivePicker(null)
            }}
            onClear={() => {
              setStartDate('')
              setActivePicker(null)
            }}
          />
        ) : null}

        <EmployeePickerField
          label="Date de fin"
          placeholder="jj/mm/aaaa"
          value={endDate}
          onPress={() => setActivePicker((current) => (current === 'end' ? null : 'end'))}
          icon="calendar-outline"
          error={errors.endDate}
        />
        {activePicker === 'end' ? (
          <EmployeeCalendarPicker
            value={endDate}
            onChange={(date) => {
              setEndDate(date)
              setActivePicker(null)
            }}
            onClear={() => {
              setEndDate('')
              setActivePicker(null)
            }}
          />
        ) : null}

        <View style={styles.inlineHeader}>
          <Text style={styles.inlineLabel}>Type de congé</Text>
          <InfoHint text="Vacances, arrêt maladie, événement familial ou autre besoin reconnu par le salon." />
        </View>
        <EmployeePickerField
          label=""
          placeholder="Sélectionner un type"
          value={leaveType}
          onPress={() => setActivePicker((current) => (current === 'type' ? null : 'type'))}
          icon="chevron-down"
          error={errors.leaveType}
        />
        {activePicker === 'type' ? (
          <EmployeeSelectList
            options={[...LEAVE_TYPES]}
            value={leaveType}
            onSelect={(value) => {
              setLeaveType(value)
              setActivePicker(null)
              if (value !== 'Autre') {
                setErrors((current) => ({ ...current, reasonDetails: undefined }))
              }
            }}
          />
        ) : null}

        {leaveType === 'Autre' ? (
          <Input
            label="Précisez le motif"
            placeholder="Exemple : rendez-vous administratif important"
            value={reasonDetails}
            onChangeText={setReasonDetails}
            multiline
            numberOfLines={4}
            inputStyle={styles.multilineInput}
            error={errors.reasonDetails}
          />
        ) : null}

        {leaveType && leaveType !== 'Autre' ? (
          <Input
            label="Commentaire complémentaire (optionnel)"
            placeholder="Ajoutez un détail si nécessaire"
            value={reasonDetails}
            onChangeText={setReasonDetails}
            multiline
            numberOfLines={3}
            inputStyle={styles.multilineInput}
          />
        ) : null}

        {reasonPreview ? (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Résumé envoyé</Text>
            <Text style={styles.previewValue}>{reasonPreview}</Text>
          </View>
        ) : null}
      </EmployeeModal>
    </Screen>
  )
}

function isValidDateValue(value: string) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value)
}

function compareDates(left: string, right: string) {
  const [leftDay, leftMonth, leftYear] = left.split('/').map(Number)
  const [rightDay, rightMonth, rightYear] = right.split('/').map(Number)
  const leftDate = new Date(leftYear, leftMonth - 1, leftDay)
  const rightDate = new Date(rightYear, rightMonth - 1, rightDay)

  return leftDate.getTime() - rightDate.getTime()
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR')
}

function toStartOfDayIso(value: string) {
  const [day, month, year] = value.split('/').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString()
}

function toEndOfDayIso(value: string) {
  const [day, month, year] = value.split('/').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString()
}

function toDateInputValue(value: string) {
  const date = new Date(value)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}/${month}/${year}`
}

function buildDurationLabel(startAt: string, endAt: string) {
  const delta = new Date(endAt).getTime() - new Date(startAt).getTime()
  const days = Math.max(1, Math.ceil(delta / (1000 * 60 * 60 * 24)))
  return `${days} jour${days > 1 ? 's' : ''}`
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newRequestButton: {
    height: 48,
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    ...typography.medium,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  pendingPill: {
    backgroundColor: '#FCE7D1',
  },
  approvedPill: {
    backgroundColor: colors.successSoft,
  },
  rejectedPill: {
    backgroundColor: '#FDE3E3',
  },
  statusText: {
    ...typography.small,
    fontWeight: '700',
  },
  pendingText: {
    color: '#CF6D10',
  },
  approvedText: {
    color: colors.successText,
  },
  rejectedText: {
    color: '#B83737',
  },
  period: {
    marginTop: spacing.sm,
    color: '#6A7A93',
    ...typography.body,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  duration: {
    color: colors.textMuted,
    ...typography.small,
  },
  managerNote: {
    marginTop: spacing.sm,
    color: colors.text,
    ...typography.small,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cardActionButton: {
    flex: 1,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inlineLabel: {
    color: colors.text,
    ...typography.small,
    fontWeight: '700',
    flex: 1,
  },
  previewBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.4)',
    backgroundColor: '#FBF5E9',
    padding: spacing.md,
    gap: spacing.xs,
  },
  previewLabel: {
    color: colors.textMuted,
    ...typography.small,
    fontWeight: '700',
  },
  previewValue: {
    color: colors.text,
    ...typography.body,
    fontWeight: '700',
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footerButton: {
    flex: 1,
  },
})
