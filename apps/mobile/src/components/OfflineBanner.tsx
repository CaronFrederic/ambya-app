import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { typography } from '../theme/typography'

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color="#7B4A00" />
      <Text style={styles.text}>
        Mode hors ligne : consultation des donnees deja synchronisees uniquement.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#F8E8C5',
    borderBottomWidth: 1,
    borderBottomColor: '#E7D39D',
  },
  text: {
    flex: 1,
    color: '#7B4A00',
    ...typography.small,
    fontWeight: '700',
  },
})

