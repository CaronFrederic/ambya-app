import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { useBooking } from '../../src/providers/BookingProvider'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

const DATES = [
  { day: 'Lun', date: 6 },
  { day: 'Mar', date: 7 },
  { day: 'Mer', date: 8 },
  { day: 'Jeu', date: 9 },
  { day: 'Ven', date: 10 },
]

const TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30']

const PROS = [
  { name: 'Sophie Martin', available: true },
  { name: 'Marie Dubois', available: true },
  { name: 'Pas de préférence', available: true },
]

export default function ScheduleScreen() {
  const { draft, patch } = useBooking()

  const [selectedDate, setSelectedDate] = useState<number | null>(draft.date?.date ?? null)
  const [selectedTime, setSelectedTime] = useState<string | null>(draft.time ?? null)
  const [selectedPro, setSelectedPro] = useState<string | null>(draft.professionalName ?? null)

  const canContinue = useMemo(() => !!selectedDate && !!selectedTime, [selectedDate, selectedTime])

  const onContinue = () => {
    const dateObj = DATES.find(d => d.date === selectedDate) || undefined
    patch({
      date: dateObj,
      time: selectedTime || undefined,
      professionalName: selectedPro || undefined,
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
          {DATES.map(({ day, date }) => {
            const active = selectedDate === date
            return (
              <Pressable
                key={date}
                onPress={() => setSelectedDate(date)}
                style={[styles.datePill, active ? styles.pillActive : styles.pillIdle]}
              >
                <Text style={[styles.dateDay, active && styles.pillTextActive]}>{day}</Text>
                <Text style={[styles.dateNum, active && styles.pillTextActive]}>{date}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={{ height: spacing.lg }} />

        <Text style={styles.blockTitle}>Sélectionnez une heure</Text>

        <View style={styles.grid}>
          {TIMES.map((t) => {
            const active = selectedTime === t
            return (
              <Pressable
                key={t}
                onPress={() => setSelectedTime(t)}
                style={[styles.timePill, active ? styles.pillActive : styles.pillIdle]}
              >
                <Text style={[styles.timeText, active && styles.pillTextActive]}>{t}</Text>
              </Pressable>
            )
          })}
        </View>

        {!!selectedDate && !!selectedTime && (
          <>
            <View style={{ height: spacing.lg }} />
            <Text style={styles.blockTitle}>Choisir un professionnel</Text>

            <View style={{ gap: spacing.md }}>
              {PROS.map((p) => {
                const active = selectedPro === p.name
                return (
                  <Pressable
                    key={p.name}
                    onPress={() => setSelectedPro(p.name)}
                    style={[
                      styles.proCard,
                      active ? styles.proCardActive : styles.proCardIdle,
                    ]}
                  >
                    <View style={styles.proRow}>
                      <LinearGradient
                        colors={[colors.brand, colors.premium]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.proAvatar}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.proName} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={styles.proStatus}>Disponible</Text>
                      </View>

                      {active && (
                        <Ionicons name="checkmark" size={18} color={colors.brand} />
                      )}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Button
          title="Passer au paiement"
          onPress={onContinue}
          disabled={!canContinue}
        />
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

  content: {
    padding: spacing.lg,
    paddingBottom: 140,
  },

  blockTitle: { color: colors.text, ...typography.body, fontWeight: '600', marginBottom: spacing.md },

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

  datePill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  dateDay: { color: colors.text, ...typography.small, marginBottom: 2 },
  dateNum: { color: colors.text, ...typography.body, fontWeight: '700' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  timePill: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: { color: colors.text, ...typography.body, fontWeight: '600' },

  proCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
  },
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
  proRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  proAvatar: { width: 48, height: 48, borderRadius: radius.full },
  proName: { color: colors.text, ...typography.body, fontWeight: '600' },
  proStatus: { color: '#0F9D58', ...typography.small, marginTop: 2 },

  bottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
})
