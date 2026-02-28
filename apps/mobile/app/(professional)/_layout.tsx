import React from "react";
import { Stack } from "expo-router";

export default function ProLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="cash-register" />
      <Stack.Screen name="salon-settings" />
      <Stack.Screen name="promotions" />
      <Stack.Screen name="loyalty" />
      <Stack.Screen name="booking-history" />
      <Stack.Screen name="client-details" />
      <Stack.Screen name="accounting-reports" />
    </Stack>
  );
}