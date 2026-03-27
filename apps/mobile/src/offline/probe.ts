import { setOfflineStatus } from './store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL

export async function probeApiReachability() {
  if (!BASE_URL) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4_000)

  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      signal: controller.signal,
    })

    // Any HTTP response means the API is reachable, even if the route is 404/401.
    setOfflineStatus(false)
    return response.ok
  } catch {
    setOfflineStatus(true)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

