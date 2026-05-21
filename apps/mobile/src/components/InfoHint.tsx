import React, { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '../theme/colors'
import { radius } from '../theme/radius'
import { spacing } from '../theme/spacing'
import { typography } from '../theme/typography'

type InfoHintProps = {
  text: string
}

export function InfoHint({ text }: InfoHintProps) {
  const [open, setOpen] = useState(false)

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Afficher une aide contextuelle"
        hitSlop={10}
        onPress={() => setOpen((current) => !current)}
        style={styles.iconButton}
      >
        <Ionicons
          name={open ? 'information-circle' : 'information-circle-outline'}
          size={18}
          color={colors.brand}
        />
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.bubble}>
            <Text style={styles.text}>{text}</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'flex-start',
  },
  iconButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },
  bubble: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: 'rgba(33, 33, 33, 0.96)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: {
    color: '#FFFFFF',
    ...typography.small,
    lineHeight: 18,
    fontWeight: '700',
  },
})
