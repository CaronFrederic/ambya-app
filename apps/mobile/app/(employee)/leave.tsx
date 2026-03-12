import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Screen } from '../../src/components/Screen'
import { EmployeeCalendarPicker } from '../../src/components/employee/EmployeeCalendarPicker'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { EmployeeModal } from '../../src/components/employee/EmployeeModal'
import { EmployeePickerField } from '../../src/components/employee/EmployeePickerField'
import { useEmployeeFlow } from '../../src/features/employee/EmployeeFlowProvider'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

type PickerType = 'start' | 'end' | null

export default function EmployeeLeaveScreen() {
  const { leaveRequests, createLeaveRequest } = useEmployeeFlow()
  const [showModal, setShowModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [activePicker, setActivePicker] = useState<PickerType>(null)
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string; reason?: string }>({})

  const closeModal = () => {
    setShowModal(false)
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

  const handleSubmit = () => {
    if (!validateForm()) return

    createLeaveRequest({
      startDate,
      endDate,
      reason: reason.trim(),
    })

    closeModal()
    Alert.alert('Demande envoyee', 'Votre demande de conges a bien ete enregistree.')
  }

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader
        title="Demandes de conges"
        subtitle="Gerez vos conges"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <Button
          title="Nouvelle demande"
          onPress={() => setShowModal(true)}
          style={styles.newRequestButton}
        />

        <View style={styles.list}>
          {leaveRequests.map((leave) => (
            <Card key={leave.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{leave.title}</Text>
                <View
                  style={[
                    styles.statusPill,
                    leave.status === 'approved' ? styles.approvedPill : styles.pendingPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      leave.status === 'approved' ? styles.approvedText : styles.pendingText,
                    ]}
                  >
                    {leave.status === 'approved' ? 'Approuve' : 'En attente'}
                  </Text>
                </View>
              </View>

              <Text style={styles.period}>{leave.period}</Text>
              <View style={styles.separator} />
              <Text style={styles.duration}>{leave.duration}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>

      <EmployeeModal
        visible={showModal}
        title="Nouvelle demande de conges"
        onClose={closeModal}
        footer={
          <>
            <Button title="Annuler" variant="secondary" onPress={closeModal} style={styles.footerButton} />
            <Button title="Envoyer" onPress={handleSubmit} style={styles.footerButton} />
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
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footerButton: {
    flex: 1,
  },
})
