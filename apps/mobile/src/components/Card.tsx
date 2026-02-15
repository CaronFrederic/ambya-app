import { View, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'

type Props = {
  children: React.ReactNode
  style?: any
}

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, // 🎯 storyboard
    padding: spacing.lg,
    borderRadius: radius.lg, // 🎯 10px exact
    borderWidth: 1,
    borderColor: colors.border,

    // 🎯 légère profondeur (premium feel)
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },

    elevation: 2, // Android
  },
})
