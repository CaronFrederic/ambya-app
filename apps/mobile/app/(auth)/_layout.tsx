import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="client-signup" />
      <Stack.Screen name="employee-activate" />
      <Stack.Screen name="employee-activation-success" />
    </Stack>
  )
}
