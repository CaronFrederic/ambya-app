import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

type Props = { label: string; tone: 'success' | 'warning' | 'danger' }

export function StatusPill({ label, tone }: Props) {
  const bg =
    tone === 'success'
      ? colors.successSoft
      : tone === 'warning'
      ? colors.warningSoft
      : colors.dangerSoft

  const fg =
    tone === 'success'
      ? colors.successText
      : tone === 'warning'
      ? colors.warningText
      : colors.dangerText

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: 'rgba(0,0,0,0.06)' }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})
