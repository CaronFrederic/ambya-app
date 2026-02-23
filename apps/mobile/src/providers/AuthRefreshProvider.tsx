import React, { createContext, useContext } from 'react'

type AuthRefreshContextValue = {
  refreshAuth: () => Promise<void>
}

const AuthRefreshContext = createContext<AuthRefreshContextValue | null>(null)

export function AuthRefreshProvider({
  children,
  refreshAuth,
}: {
  children: React.ReactNode
  refreshAuth: () => Promise<void>
}) {
  return <AuthRefreshContext.Provider value={{ refreshAuth }}>{children}</AuthRefreshContext.Provider>
}

export function useAuthRefresh() {
  const ctx = useContext(AuthRefreshContext)
  if (!ctx) throw new Error('useAuthRefresh must be used within AuthRefreshProvider')
  return ctx
}