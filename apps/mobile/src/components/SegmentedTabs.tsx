import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

type TabKey = 'upcoming' | 'past'

type Props = {
  value: TabKey
  onChange: (v: TabKey) => void
}

export function SegmentedTabs({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange('upcoming')}
        style={[styles.tab, value === 'upcoming' && styles.tabActive]}
      >
        <Text style={[styles.text, value === 'upcoming' && styles.textActive]}>À venir</Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('past')}
        style={[styles.tab, value === 'past' && styles.tabActive]}
      >
        <Text style={[styles.text, value === 'past' && styles.textActive]}>Passés</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  text: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 15,
  },
  textActive: {
    color: colors.brandForeground,
  },
})
