import { Stack } from 'expo-router'
import { QueryProvider } from '../src/providers/QueryProvider'

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(professional)" />
        <Stack.Screen name="(employee)" />
      </Stack>
    </QueryProvider>
  )
}
