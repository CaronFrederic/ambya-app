import { View, Text, StyleSheet } from 'react-native'
import { spacing } from '../theme/spacing'
import { typography } from '../theme/typography'
import { colors } from '../theme/colors'

type Props = {
  title: string
  subtitle?: string
  rightSlot?: React.ReactNode
}

export function Header({ title, subtitle, rightSlot }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {rightSlot ? <View>{rightSlot}</View> : null}
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md, // 🎯 un peu plus “tight” comme Figma
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
})
