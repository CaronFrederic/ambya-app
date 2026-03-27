import { Alert } from 'react-native'

import { getOfflineStatus } from './store'

export const OFFLINE_ACTION_ERROR_CODE = 'OFFLINE_ACTION_BLOCKED'

export class OfflineActionError extends Error {
  code = OFFLINE_ACTION_ERROR_CODE

  constructor(actionLabel: string) {
    super(buildOfflineActionMessage(actionLabel))
    this.name = 'OfflineActionError'
  }
}

export function buildOfflineActionMessage(actionLabel: string) {
  return `Impossible de ${actionLabel} sans connexion. Vous pouvez continuer a consulter les donnees deja synchronisees.`
}

export function requireOnlineAction(actionLabel: string) {
  if (!getOfflineStatus()) return true

  Alert.alert('Mode hors ligne', buildOfflineActionMessage(actionLabel))
  return false
}

export function isOfflineActionError(error: unknown) {
  return (
    error instanceof OfflineActionError ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === OFFLINE_ACTION_ERROR_CODE)
  )
}
