import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// ⚠️ IMPORTANT: sur téléphone physique, localhost ne marche pas.
// Mets ton IP locale ex: http://192.168.1.20:3000
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.20:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
