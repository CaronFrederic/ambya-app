import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
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
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })
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

export default function ScheduleScreen() {
  const { draft, patch } = useBooking()

  const days = useMemo(() => getNextDays(7), [])
  const [selectedDateIso, setSelectedDateIso] = useState<string>(draft.selectedDateIso ?? days[0].iso)
  const [selectedTime, setSelectedTime] = useState<string | null>(draft.time ?? null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(draft.selectedEmployeeId ?? null)

  const serviceIds = useMemo(() => draft.cart.map((item) => item.id), [draft.cart])
  const { data, isLoading } = useSalonAvailability({
    salonId: draft.salonId,
    date: selectedDateIso,
    serviceIds,
  })

  const timeSlots = data?.slots ?? []
  const professionals = data?.professionals ?? []

  const filteredProfessionals = useMemo(() => {
    if (!selectedTime) return professionals
    return professionals.filter((professional) =>
      professional.slots.some((slot) => slot.time === selectedTime && slot.available),
    )
  }, [professionals, selectedTime])

  const canContinue = !!selectedDateIso && !!selectedTime

  const onContinue = () => {
    const day = days.find((d) => d.iso === selectedDateIso)
    patch({
      selectedDateIso,
      date: day ? { day: day.label, date: Number(day.iso.slice(-2)) } : undefined,
      time: selectedTime ?? undefined,
      selectedEmployeeId: selectedEmployeeId ?? undefined,
      professionalName: (() => {
        const professional = professionals.find((p) => p.id === selectedEmployeeId)
        return professional ? formatProfessionalLabel(professional) : undefined
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
        <Text style={styles.headerTitle}>Choisir un créneau</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.blockTitle}>Sélectionnez une date</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {days.map((d) => {
            const active = selectedDateIso === d.iso
            return (
              <Pressable key={d.iso} onPress={() => setSelectedDateIso(d.iso)} style={[styles.datePill, active ? styles.pillActive : styles.pillIdle]}>
                <Text style={[styles.dateDay, active && styles.pillTextActive]}>{d.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={{ height: spacing.lg }} />

        <Text style={styles.blockTitle}>Sélectionnez une heure</Text>
        {isLoading ? <Text>Chargement des créneaux...</Text> : null}
        <View style={styles.grid}>
          {timeSlots.map((slot) => {
            const active = selectedTime === slot.time
            return (
              <Pressable
                key={slot.time}
                onPress={() => slot.available && setSelectedTime(slot.time)}
                style={[styles.timePill, active ? styles.pillActive : styles.pillIdle, !slot.available && styles.disabledPill]}
              >
                <Text style={[styles.timeText, active && styles.pillTextActive]}>{slot.time}</Text>
              </Pressable>
            )
          })}
        </View>

        {!!selectedTime && (
          <>
            <View style={{ height: spacing.lg }} />
            <Text style={styles.blockTitle}>Choisir un professionnel (optionnel)</Text>

            <View style={{ gap: spacing.md }}>
              {filteredProfessionals.map((p) => {
                const active = selectedEmployeeId === p.id
                return (
                  <Pressable key={p.id} onPress={() => setSelectedEmployeeId(active ? null : p.id)} style={[styles.proCard, active ? styles.proCardActive : styles.proCardIdle]}>
                    <Text style={styles.proName}>{formatProfessionalLabel(p)}</Text>
                    <Text style={styles.proStatus}>{active ? 'Sélectionné' : 'Disponible'}</Text>
                  </Pressable>
                )
              })}
            </View>
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
  blockTitle: { color: colors.text, ...typography.body, fontWeight: '600', marginBottom: spacing.md },
  pillIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: overlays.brand20 },
  pillActive: { backgroundColor: colors.brand, borderWidth: 1, borderColor: colors.brand },
  pillTextActive: { color: colors.brandForeground },
  disabledPill: { opacity: 0.35 },
  datePill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.text, ...typography.small },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  timePill: { width: '30%', paddingVertical: 12, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  timeText: { color: colors.text, ...typography.body, fontWeight: '600' },
  proCard: { borderRadius: radius.xl, padding: spacing.md },
  proCardIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: overlays.brand20 },
  proCardActive: { backgroundColor: overlays.brand05, borderWidth: 2, borderColor: colors.brand },
  proName: { color: colors.text, ...typography.body, fontWeight: '600' },
  proStatus: { color: '#0F9D58', ...typography.small, marginTop: 2 },
  bottom: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
})
