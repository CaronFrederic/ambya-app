import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { FeedbackState } from '../../src/components/FeedbackState'
import { EmployeeCalendarPicker } from '../../src/components/employee/EmployeeCalendarPicker'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { EmployeeModal } from '../../src/components/employee/EmployeeModal'
import { EmployeePickerField } from '../../src/components/employee/EmployeePickerField'
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

type PickerType = 'start' | 'end' | null

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
  const [reason, setReason] = useState('')
  const [activePicker, setActivePicker] = useState<PickerType>(null)
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string; reason?: string }>({})

  const closeModal = () => {
    setShowModal(false)
    setEditingLeaveId(null)
    setStartDate('')
    setEndDate('')
    setReason('')
    setActivePicker(null)
    setErrors({})
  }

  const validateForm = () => {
    const nextErrors: { startDate?: string; endDate?: string; reason?: string } = {}

    if (!isValidDateValue(startDate)) {
      nextErrors.startDate = 'Selectionnez une date de debut valide.'
    }

    if (!isValidDateValue(endDate)) {
      nextErrors.endDate = 'Selectionnez une date de fin valide.'
    }

    if (isValidDateValue(startDate) && isValidDateValue(endDate) && compareDates(startDate, endDate) > 0) {
      nextErrors.endDate = 'La date de fin doit etre apres la date de debut.'
    }

    if (!reason.trim()) {
      nextErrors.reason = 'Le motif est requis.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!requireOnlineAction(editingLeaveId ? 'modifier une demande de conges' : 'envoyer une demande de conges')) return
    if (!validateForm()) return

    try {
      if (editingLeaveId) {
        await updateLeaveRequest.mutateAsync({
          id: editingLeaveId,
          startAt: toStartOfDayIso(startDate),
          endAt: toEndOfDayIso(endDate),
          reason: reason.trim(),
        })
      } else {
        await createLeaveRequest.mutateAsync({
          startAt: toStartOfDayIso(startDate),
          endAt: toEndOfDayIso(endDate),
          reason: reason.trim(),
        })
      }
      closeModal()
      Alert.alert(
        editingLeaveId ? 'Demande modifiee' : 'Demande envoyee',
        editingLeaveId
          ? 'Votre demande de conges a bien ete mise a jour.'
          : 'Votre demande de conges a bien ete enregistree.',
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
    setEditingLeaveId(leave.id)
    setStartDate(toDateInputValue(leave.startAt))
    setEndDate(toDateInputValue(leave.endAt))
    setReason(leave.reason)
    setErrors({})
    setActivePicker(null)
    setShowModal(true)
  }

  const handleCancelLeave = (leaveId: string) => {
    if (!requireOnlineAction('annuler une demande de conges')) return
    Alert.alert(
      'Annuler cette demande',
      'Cette demande de conges en attente sera supprimee.',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la demande',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelLeaveRequest.mutateAsync({ id: leaveId })
              Alert.alert('Demande annulee', 'La demande de conges a bien ete annulee.')
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
      <EmployeeHeader title="Demandes de conges" subtitle="Gerez vos conges" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <Button
          title="Nouvelle demande"
          onPress={openCreateModal}
          style={styles.newRequestButton}
          disabled={isOffline}
        />

        <View style={styles.list}>
          {leaveRequests.isLoading ? (
            <FeedbackState
              icon="time-outline"
              title="Chargement des demandes"
              description="Vos demandes de conges arrivent."
            />
          ) : leaveRequests.isError ? (
            <FeedbackState
              icon="alert-circle-outline"
              title="Impossible de charger les conges"
              description="Reessayez dans un instant."
              actionLabel="Reessayer"
              onAction={() => void leaveRequests.refetch()}
            />
          ) : (leaveRequests.data?.items.length ?? 0) === 0 ? (
            <FeedbackState
              icon="document-text-outline"
              title="Aucune demande de conges"
              description="Vos futures demandes apparaitront ici."
            />
          ) : (
            leaveRequests.data?.items.map((leave) => (
              <Card key={leave.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{leave.reason}</Text>
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
                        ? 'Approuve'
                        : leave.status === 'REJECTED'
                          ? 'Refuse'
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
        title={editingLeaveId ? 'Modifier la demande' : 'Nouvelle demande de conges'}
        onClose={closeModal}
        footer={
          <>
            <Button title="Annuler" variant="secondary" onPress={closeModal} style={styles.footerButton} />
            <Button
              title={
                createLeaveRequest.isPending || updateLeaveRequest.isPending
                  ? 'Enregistrement...'
                  : editingLeaveId
                    ? 'Mettre a jour'
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
          label="Date de debut"
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

        <Input
          label="Motif"
          placeholder="Conges annuels, evenement familial..."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          inputStyle={styles.multilineInput}
          error={errors.reason}
        />
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
  newRequestButton: {
    height: 48,
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
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footerButton: {
    flex: 1,
  },
})

