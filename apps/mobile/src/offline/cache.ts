import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY_PREFIX = 'offline-cache:'

type OfflineCacheEnvelope<T> = {
  updatedAt: string
  data: T
}

function buildKey(key: string) {
  return `${KEY_PREFIX}${key}`
}

export async function writeOfflineCache<T>(key: string, data: T) {
  const payload: OfflineCacheEnvelope<T> = {
    updatedAt: new Date().toISOString(),
    data,
  }

  await AsyncStorage.setItem(buildKey(key), JSON.stringify(payload))
}

export async function readOfflineCache<T>(key: string) {
  const raw = await AsyncStorage.getItem(buildKey(key))
  if (!raw) return null

  try {
    return JSON.parse(raw) as OfflineCacheEnvelope<T>
  } catch {
    return null
  }
}

