import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { radius } from '../theme/radius'
import { spacing } from '../theme/spacing'

type Props = {
  name: React.ComponentProps<typeof Ionicons>['name']
  onPress?: () => void
  size?: number
  style?: any
}

export function IconBubble({ name, onPress, size = 16, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.bubble, style]}>
      <Ionicons name={name} size={size} color={colors.brand} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  bubble: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
