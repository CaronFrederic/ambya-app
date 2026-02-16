import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { typography } from '../theme/typography'

type Props = {
  title: string
  subtitle?: string
  canGoBack?: boolean
}

export function Header({ title, subtitle, canGoBack = true }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {canGoBack ? (
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.center}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {/* Symétrie pour un vrai centrage */}
        <View style={styles.backPlaceholder} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },

  bar: {
    backgroundColor: colors.brand,
    borderRadius: 22, // + capsule
    paddingVertical: 20, // + hero
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 36, height: 36 },

  backText: { color: colors.brandForeground, fontSize: 20, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center' },

  title: { ...typography.h2, color: colors.brandForeground, textAlign: 'center' },
  subtitle: {
    ...typography.small,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
})
