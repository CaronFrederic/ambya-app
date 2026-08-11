import AsyncStorage from '@react-native-async-storage/async-storage'

type ReminderStage = 'day1' | 'day7' | 'day21'

const DAY_MS = 24 * 60 * 60 * 1000
const sessionShown = new Set<string>()

function stageFor(createdAt?: string | null): ReminderStage | null {
  if (!createdAt) return null

  const createdTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdTime)) return null

  const ageDays = Math.floor((Date.now() - createdTime) / DAY_MS)
  if (ageDays >= 21) return 'day21'
  if (ageDays >= 7) return 'day7'
  if (ageDays >= 1) return 'day1'
  return null
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function shouldShowClientProfileReminder(input: {
  userId?: string | null
  createdAt?: string | null
  isComplete: boolean
}) {
  if (!input.userId || input.isComplete) return null

  const stage = stageFor(input.createdAt)
  if (!stage) return null

  const baseKey = `client-profile-reminder:${input.userId}:${stage}`
  const dayKey = `${baseKey}:${todayKey()}`

  if (sessionShown.has(baseKey)) return null

  const [alreadyShownStage, alreadyShownToday] = await Promise.all([
    AsyncStorage.getItem(baseKey),
    AsyncStorage.getItem(dayKey),
  ])

  if (alreadyShownStage || alreadyShownToday) return null

  sessionShown.add(baseKey)
  await Promise.all([
    AsyncStorage.setItem(baseKey, 'shown'),
    AsyncStorage.setItem(dayKey, 'shown'),
  ])

  return stage
}
