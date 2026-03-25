import React, { useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

import { QueryProvider } from '../src/providers/QueryProvider'
import { BookingProvider } from '../src/providers/BookingProvider'
import { ProfileProvider } from '../src/providers/ProfileProvider'
import { PaymentProvider } from '../src/providers/PaymentProvider'
import { AuthRefreshProvider } from '../src/providers/AuthRefreshProvider'

const AUTH_TOKEN_KEY = 'accessToken'
const ROLE_KEY = 'userRole'

type Role = 'CLIENT' | 'PROFESSIONAL' | 'EMPLOYEE' | 'ADMIN'

function normalizeRole(role: string | null): Role {
  const normalized = (role ?? 'CLIENT').toUpperCase()
  if (
    normalized === 'CLIENT' ||
    normalized === 'PROFESSIONAL' ||
    normalized === 'EMPLOYEE' ||
    normalized === 'ADMIN'
  ) {
    return normalized
  }

  return 'CLIENT'
}

function homeForRole(role: Role) {
  switch (role) {
    case 'PROFESSIONAL':
      return '/(professional)/dashboard' as const
    case 'EMPLOYEE':
      return '/(employee)/dashboard' as const
    case 'ADMIN':
      return '/(admin)/dashboard' as const
    case 'CLIENT':
    default:
      return '/(tabs)/home' as const
  }
}

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const [ready, setReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<Role>('CLIENT')

  const refreshAuth = async () => {
    try {
      const [token, storedRole] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(ROLE_KEY),
      ])

      setIsLoggedIn(Boolean(token))
      setRole(normalizeRole(storedRole))
    } catch {
      setIsLoggedIn(false)
      setRole('CLIENT')
    }
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      await refreshAuth()
      if (mounted) {
        setReady(true)
      }
    })()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshAuth()
      }
    })

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  const allowedGroups = useMemo(() => {
    switch (role) {
      case 'CLIENT':
        return new Set(['(auth)', '(tabs)', '(screens)'])
      case 'PROFESSIONAL':
        return new Set(['(auth)', '(professional)'])
      case 'EMPLOYEE':
        return new Set(['(auth)', '(employee)'])
      case 'ADMIN':
        return new Set(['(auth)', '(admin)'])
      default:
        return new Set(['(auth)'])
    }
  }, [role])

  useEffect(() => {
    if (!ready) return

    const group = segments[0]
    const inAuth = group === '(auth)'

    if (!isLoggedIn && !inAuth) {
      router.replace('/(auth)/login')
      return
    }

    if (isLoggedIn && inAuth) {
      router.replace(homeForRole(role) as never)
      return
    }

    if (isLoggedIn && group && !allowedGroups.has(group)) {
      router.replace(homeForRole(role) as never)
    }
  }, [allowedGroups, isLoggedIn, ready, role, router, segments])

  if (!ready) return null

  return (
    <AuthRefreshProvider refreshAuth={refreshAuth}>
      <QueryProvider>
        <BookingProvider>
          <ProfileProvider>
            <PaymentProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(screens)" />
                <Stack.Screen name="(professional)" />
                <Stack.Screen name="(employee)" />
                <Stack.Screen name="(admin)" />
              </Stack>
            </PaymentProvider>
          </ProfileProvider>
        </BookingProvider>
      </QueryProvider>
    </AuthRefreshProvider>
  )
}
