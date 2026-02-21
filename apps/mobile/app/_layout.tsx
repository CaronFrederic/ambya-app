// app/_layout.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { QueryProvider } from '../src/providers/QueryProvider'
import { BookingProvider } from '../src/providers/BookingProvider'
import { ProfileProvider } from '../src/providers/ProfileProvider'

const AUTH_TOKEN_KEY = 'accessToken'
const ROLE_KEY = 'userRole'

type Role = 'CLIENT' | 'PROFESSIONAL' | 'EMPLOYEE' | 'ADMIN'

function normalizeRole(role: string | null): Role {
  const r = (role ?? 'CLIENT').toUpperCase()
  if (r === 'CLIENT' || r === 'PROFESSIONAL' || r === 'EMPLOYEE' || r === 'ADMIN') return r
  return 'CLIENT'
}

function homeForRole(role: Role) {
  switch (role) {
    case 'PROFESSIONAL':
      return '/(professional)/dashboard' as const
    case 'EMPLOYEE':
      return '/(employee)/dashboard' as const
    case 'ADMIN':
      return '/(professional)/dashboard' as const // ajuste si tu crées un admin dashboard
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

  // read token + role at startup
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const [token, storedRole] = await Promise.all([
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          SecureStore.getItemAsync(ROLE_KEY),
        ])
        if (!mounted) return
        setIsLoggedIn(!!token)
        setRole(normalizeRole(storedRole))
      } catch {
        if (!mounted) return
        setIsLoggedIn(false)
        setRole('CLIENT')
      } finally {
        if (!mounted) return
        setReady(true)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  // allowed groups per role (EXACTEMENT comme tu l'as demandé)
  const allowedGroups = useMemo(() => {
    switch (role) {
      case 'CLIENT':
        return new Set(['(auth)', '(tabs)', '(screens)'])
      case 'PROFESSIONAL':
        return new Set(['(auth)', '(professional)'])
      case 'EMPLOYEE':
        return new Set(['(auth)', '(employee)'])
      case 'ADMIN':
        // admin => accès total (tu peux restreindre si besoin)
        return new Set(['(auth)', '(tabs)', '(screens)', '(professional)', '(employee)'])
      default:
        return new Set(['(auth)'])
    }
  }, [role])

  // guard
  useEffect(() => {
    if (!ready) return

    const group = segments[0] // "(tabs)" | "(screens)" | "(professional)" | "(employee)" | "(auth)"
    const inAuth = group === '(auth)'

    // not logged in -> only auth
    if (!isLoggedIn && !inAuth) {
      router.replace('/(auth)/login')
      return
    }

    // logged in -> auth pages not allowed
    if (isLoggedIn && inAuth) {
      router.replace(homeForRole(role))
      return
    }

    // logged in -> forbidden group -> redirect to role home
    if (isLoggedIn && group && !allowedGroups.has(group)) {
      router.replace(homeForRole(role))
    }
  }, [ready, isLoggedIn, role, allowedGroups, segments, router])

  if (!ready) return null

  return (
    <QueryProvider>
      <BookingProvider>
        <ProfileProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(screens)" />
            <Stack.Screen name="(professional)" />
            <Stack.Screen name="(employee)" />
          </Stack>
        </ProfileProvider>
      </BookingProvider>
    </QueryProvider>
  )
}
