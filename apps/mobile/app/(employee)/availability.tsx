import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Button } from '../../src/components/Button'
import { Card } from '../../src/components/Card'
import { Screen } from '../../src/components/Screen'
import { EmployeeHeader } from '../../src/components/employee/EmployeeHeader'
import { useEmployeeFlow } from '../../src/features/employee/EmployeeFlowProvider'
import { colors } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { spacing } from '../../src/theme/spacing'
import { typography } from '../../src/theme/typography'

export default function EmployeeAvailabilityScreen() {
  const { availableSlots, assignSlot } = useEmployeeFlow()

  return (
    <Screen noPadding style={styles.screen}>
      <EmployeeHeader
        title="Creneaux disponibles"
        subtitle="Rendez-vous non assignes"
        canGoBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <View style={styles.infoBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#D4AF6A" />
          <Text style={styles.infoText}>
            Ces creneaux sont disponibles pour etre pris en charge. Vous pouvez les assigner a votre planning.
          </Text>
        </View>

        <View style={styles.list}>
          {availableSlots.map((slot) => (
            <Card key={slot.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.service}>{slot.service}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Non assigne</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{slot.date}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{slot.time}</Text>
                </View>
              </View>

              <Button
                title="Prendre en charge"
                onPress={() => {
                  assignSlot(slot.id)
                  Alert.alert('Creneau assigne', 'Le creneau a ete ajoute a votre agenda.')
                }}
                style={styles.button}
              />
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F0EB',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.4)',
    backgroundColor: '#FBF5E9',
  },
  infoText: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    lineHeight: 22,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  service: {
    color: colors.text,
    ...typography.h3,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#FDE7D0',
  },
  badgeText: {
    color: '#D2691E',
    ...typography.small,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
    ...typography.small,
  },
  button: {
    marginTop: spacing.lg,
  },
})
