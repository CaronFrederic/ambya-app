import { View, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

type Props = {
  children: React.ReactNode
  scroll?: boolean
  padded?: boolean
}

export function Screen({ children, scroll = false, padded = true }: Props) {
  const content = (
    <View style={[styles.container, padded && { padding: spacing.lg }]}>
      {children}
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
