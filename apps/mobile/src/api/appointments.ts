import { useQuery } from '@tanstack/react-query'
import { api } from './client'

export type AppointmentListResponse = {
  items: Array<{
    id: string
    status: string
    startAt: string
    endAt: string
    salon: { id: string; name: string }
    service: { id: string; name: string; durationMin: number; price: number }
    employee?: { id: string; displayName: string } | null
  }>
  total: number
}

export type CreateAppointmentPayload = {
  salonId: string
  serviceId: string
  startAt: string
  employeeId?: string
  note?: string
}

export async function fetchAppointments() {
  const res = await api.get<AppointmentListResponse>('/appointments')
  return res.data
}

export function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: fetchAppointments,

    // ✅ "Affichage RDV avec cache"
    staleTime: 60_000,       // 1 min fresh (pas de refetch inutile)
    gcTime: 10 * 60_000,     // 10 min en cache
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const res = await api.post('/appointments', payload)
  return res.data
}
