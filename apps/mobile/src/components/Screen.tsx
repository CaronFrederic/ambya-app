import { View, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

type Props = {
  children: React.ReactNode
  scroll?: boolean
}

export function Screen({ children, scroll = false }: Props) {
  const content = <View style={styles.container}>{children}</View>

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl },
  scroll: { flexGrow: 1 },
})
