import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { AppState } from 'react-native'

import { OfflineBanner } from '../components/OfflineBanner'
import { probeApiReachability } from '../offline/probe'
import { getOfflineStatus, subscribeOfflineStatus } from '../offline/store'

type OfflineContextValue = {
  isOffline: boolean
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

export function OfflineProvider({ children }: PropsWithChildren) {
  const isOffline = useSyncExternalStore(
    subscribeOfflineStatus,
    getOfflineStatus,
    getOfflineStatus,
  )

  useEffect(() => {
    void probeApiReachability()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void probeApiReachability()
      }
    })

    return () => subscription.remove()
  }, [])

  const value = useMemo(
    () => ({
      isOffline,
    }),
    [isOffline],
  )

  return (
    <OfflineContext.Provider value={value}>
      <OfflineBanner visible={isOffline} />
      {children}
    </OfflineContext.Provider>
  )
}

export function useOfflineStatus() {
  const context = useContext(OfflineContext)

  if (!context) {
    throw new Error('useOfflineStatus must be used within OfflineProvider')
  }

  return context
}

