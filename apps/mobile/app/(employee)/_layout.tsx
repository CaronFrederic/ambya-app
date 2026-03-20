import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '../../src/theme/colors'

export default function EmployeeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Conges',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="availability" options={{ href: null }} />
      <Tabs.Screen name="appointment-detail" options={{ href: null }} />
    </Tabs>
  )
}
