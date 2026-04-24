const listeners = new Set<() => void>()

let offline = false

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export function getOfflineStatus() {
  return offline
}

export function setOfflineStatus(next: boolean) {
  if (offline === next) return
  offline = next
  emit()
}

export function subscribeOfflineStatus(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isLikelyNetworkError(error: unknown) {
  const maybe = error as {
    code?: string
    message?: string
    response?: unknown
    request?: unknown
    isAxiosError?: boolean
    status?: number
  }

  if (typeof maybe?.status === 'number') return false
  if (maybe?.response) return false

  const message = String(maybe?.message ?? '').toLowerCase()
  const code = String(maybe?.code ?? '').toLowerCase()

  return (
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('timeout') ||
    code === 'ecconnaborted' ||
    code === 'enotfound'
  )
}
