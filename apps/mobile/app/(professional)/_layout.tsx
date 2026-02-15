import { Stack } from 'expo-router'

export default function ProfessionalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="employees" />
      <Stack.Screen name="services" />
      <Stack.Screen name="caisse" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
