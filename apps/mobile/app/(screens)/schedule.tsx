import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { FeedbackState } from '../../src/components/FeedbackState'
import { useBooking } from '../../src/providers/BookingProvider'
import { useSalonAvailability } from '../../src/api/discovery'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

function getNextDays(count: number) {
  const items: Array<{ label: string; iso: string }> = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
    items.push({ label, iso })
  }
  return items
}

function formatProfessionalLabel(professional: {
  displayName: string
  primarySpecialtyLabel?: string | null
}) {
  return professional.primarySpecialtyLabel
    ? `${professional.displayName} - ${professional.primarySpecialtyLabel}`
    : professional.displayName
}

function isPastSlot(dateIso: string, time: string) {
  const slotDate = new Date(`${dateIso}T${time}:00.000Z`)
  return slotDate.getTime() <= Date.now()
}

export default function ScheduleScreen() {
  const { draft, patch } = useBooking()

  const days = useMemo(() => getNextDays(7), [])
  const [selectedDateIso, setSelectedDateIso] = useState<string>(
    draft.selectedDateIso ?? days[0].iso,
  )
  const [selectedTime, setSelectedTime] = useState<string | null>(draft.time ?? null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    draft.selectedEmployeeId ?? null,
  )

  const serviceIds = useMemo(() => draft.cart.map((item) => item.id), [draft.cart])
  const { data, isLoading, isError, refetch } = useSalonAvailability({
    salonId: draft.salonId,
    date: selectedDateIso,
    serviceIds,
  })

  const timeSlots = data?.slots ?? []
  const professionals = data?.professionals ?? []

  const upcomingSlots = useMemo(
    () => timeSlots.filter((slot) => !isPastSlot(selectedDateIso, slot.time)),
    [selectedDateIso, timeSlots],
  )

  const filteredProfessionals = useMemo(() => {
    if (!selectedTime) return professionals
    return professionals.filter((professional) =>
      professional.slots.some((slot) => slot.time === selectedTime && slot.available),
    )
  }, [professionals, selectedTime])

  const effectiveEmployeeId = useMemo(
    () =>
      selectedEmployeeId &&
      filteredProfessionals.some((professional) => professional.id === selectedEmployeeId)
        ? selectedEmployeeId
        : null,
    [filteredProfessionals, selectedEmployeeId],
  )

  useEffect(() => {
    if (selectedTime && !upcomingSlots.some((slot) => slot.time === selectedTime)) {
      setSelectedTime(null)
      setSelectedEmployeeId(null)
      return
    }

    if (
      selectedEmployeeId &&
      !filteredProfessionals.some((professional) => professional.id === selectedEmployeeId)
    ) {
      setSelectedEmployeeId(null)
    }
  }, [filteredProfessionals, selectedEmployeeId, selectedTime, upcomingSlots])

  const canContinue = !!selectedDateIso && !!selectedTime

  const onContinue = () => {
    const day = days.find((d) => d.iso === selectedDateIso)
    patch({
      selectedDateIso,
      date: day ? { day: day.label, date: Number(day.iso.slice(-2)) } : undefined,
      time: selectedTime ?? undefined,
      selectedEmployeeId: effectiveEmployeeId ?? undefined,
      professionalName: (() => {
        const professional = professionals.find((p) => p.id === effectiveEmployeeId)
        if (professional) return formatProfessionalLabel(professional)
        return draft.cart.length > 1 ? 'Assignation automatique du salon' : undefined
      })(),
    })
    router.push('/(screens)/payment')
  }

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={22} color="#fff" onPress={() => router.back()} />
        </View>
        <Text style={styles.headerTitle}>Choisir un creneau</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.blockTitle}>Selectionnez une date</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {days.map((d) => {
            const active = selectedDateIso === d.iso
            return (
              <Pressable
                key={d.iso}
                onPress={() => setSelectedDateIso(d.iso)}
                style={[styles.datePill, active ? styles.pillActive : styles.pillIdle]}
              >
                <Text style={[styles.dateDay, active && styles.pillTextActive]}>{d.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={{ height: spacing.lg }} />

        <Text style={styles.blockTitle}>Selectionnez une heure</Text>
        {isLoading ? (
          <FeedbackState
            icon="time-outline"
            title="Chargement des creneaux"
            description="Nous verifions les disponibilites du salon."
          />
        ) : isError ? (
          <FeedbackState
            icon="alert-circle-outline"
            title="Impossible de charger les creneaux"
            description="Reessayez dans un instant."
            actionLabel="Reessayer"
            onAction={() => void refetch()}
          />
        ) : upcomingSlots.length === 0 ? (
          <FeedbackState
            icon="calendar-clear-outline"
            title="Aucun creneau disponible"
            description="Essayez une autre date pour continuer votre reservation."
          />
        ) : (
          <View style={styles.grid}>
            {upcomingSlots.map((slot) => {
              const active = selectedTime === slot.time
              return (
                <Pressable
                  key={slot.time}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  style={[
                    styles.timePill,
                    active ? styles.pillActive : styles.pillIdle,
                    !slot.available && styles.disabledPill,
                  ]}
                >
                  <Text style={[styles.timeText, active && styles.pillTextActive]}>
                    {slot.time}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}

        {!!selectedTime && (
          <>
            <View style={{ height: spacing.lg }} />
            <Text style={styles.blockTitle}>Choisir un professionnel (optionnel)</Text>

            {filteredProfessionals.length === 0 ? (
              <View style={styles.autoAssignBox}>
                <Text style={styles.autoAssignTitle}>Assignation automatique</Text>
                <Text style={styles.autoAssignText}>
                  Aucun employe unique ne couvre tout le panier a ce creneau. Le
                  salon repartira les services entre plusieurs employes compatibles.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                {filteredProfessionals.map((professional) => {
                  const active = effectiveEmployeeId === professional.id
                  return (
                    <Pressable
                      key={professional.id}
                      onPress={() =>
                        setSelectedEmployeeId(active ? null : professional.id)
                      }
                      style={[
                        styles.proCard,
                        active ? styles.proCardActive : styles.proCardIdle,
                      ]}
                    >
                      <Text style={styles.proName}>
                        {formatProfessionalLabel(professional)}
                      </Text>
                      <Text style={styles.proStatus}>
                        {active ? 'Selectionne' : 'Disponible'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Button title="Passer au paiement" onPress={onContinue} disabled={!canContinue} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { marginBottom: spacing.md },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },
  content: { padding: spacing.lg, paddingBottom: 140 },
  blockTitle: {
    color: colors.text,
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  pillIdle: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  pillActive: {
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  pillTextActive: { color: colors.brandForeground },
  disabledPill: { opacity: 0.35 },
  datePill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { color: colors.text, ...typography.small },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  timePill: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: { color: colors.text, ...typography.body, fontWeight: '600' },
  proCard: { borderRadius: radius.xl, padding: spacing.md },
  proCardIdle: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  proCardActive: {
    backgroundColor: overlays.brand05,
    borderWidth: 2,
    borderColor: colors.brand,
  },
  proName: { color: colors.text, ...typography.body, fontWeight: '600' },
  proStatus: { color: '#0F9D58', ...typography.small, marginTop: 2 },
  autoAssignBox: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  autoAssignTitle: {
    color: colors.brand,
    ...typography.body,
    fontWeight: '700',
  },
  autoAssignText: {
    color: colors.textMuted,
    ...typography.small,
    lineHeight: 20,
  },
  bottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
})
