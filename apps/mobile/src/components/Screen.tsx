import React from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

type Props = {
  children: React.ReactNode
  noPadding?: boolean
  style?: any
  contentStyle?: any

  // new
  scroll?: boolean
  keyboard?: boolean
  scrollContentStyle?: any
}

export function Screen({
  children,
  noPadding,
  style,
  contentStyle,
  scroll,
  keyboard,
  scrollContentStyle,
}: Props) {
  const Container = (
    <View style={[styles.container, noPadding && styles.noPadding, contentStyle]}>
      {children}
    </View>
  )

  const Body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        !noPadding && { padding: spacing.lg },
        noPadding && { padding: 0 },
        scrollContentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    Container
  )

  const Wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {Body}
    </KeyboardAvoidingView>
  ) : (
    Body
  )

  return (
    <SafeAreaView style={[styles.safe, style]}>
      {Wrapped}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  noPadding: {
    padding: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
