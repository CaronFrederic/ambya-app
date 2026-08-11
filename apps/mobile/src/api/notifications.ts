import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

export type AppNotification = {
  id: string
  type:
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_CONFIRMED'
    | 'APPOINTMENT_UPDATED'
    | 'APPOINTMENT_RESCHEDULED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_PAID'
    | 'APPOINTMENT_EMPLOYEE_ASSIGNED'
  title: string
  message: string
  targetRoute: string | null
  metadata: {
    appointmentId?: string
    salonId?: string
    employeeId?: string
    role?: string
  } | null
  readAt: string | null
  createdAt: string
  appointmentId: string | null
  salonId: string | null
}

export type NotificationsResponse = {
  items: AppNotification[]
  unreadCount: number
}

export type NotificationSummaryResponse = {
  unreadCount: number
}

async function fetchNotifications() {
  const res = await api.get<NotificationsResponse>('/notifications')
  return res.data
}

async function fetchNotificationSummary() {
  const res = await api.get<NotificationSummaryResponse>('/notifications/summary')
  return res.data
}

async function markNotificationRead(id: string) {
  const res = await api.patch<AppNotification & { unreadCount: number }>(
    `/notifications/${id}/read`,
  )
  return res.data
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 15_000,
  })
}

export function useNotificationSummary() {
  return useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: fetchNotificationSummary,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] }),
      ])
    },
  })
}
