import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { useOfflineCachedQuery } from './useOfflineCachedQuery'

export type EmployeeScheduleStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'

export type EmployeePaymentStatus = 'CREATED' | 'SUCCEEDED' | 'REFUNDED'

export type EmployeeService = {
  id: string
  name: string
  category: string
  durationMin: number
  price: number
}

export type EmployeeScheduleItem = {
  kind: 'appointment' | 'blocked_slot'
  id: string
  status: EmployeeScheduleStatus
  isPaid: boolean
  paymentStatus: EmployeePaymentStatus
  clientName: string
  clientPhone: string | null
  service: EmployeeService
  startAt: string
  endAt: string
  amount: number
  note: string | null
}

export type EmployeeScheduleItemDetails = EmployeeScheduleItem & {
  salon: { id: string; name: string }
  client: {
    id: string | null
    name: string
    email: string | null
    phone: string | null
    allergies: string | null
    comments: string | null
  }
  insights: Array<{ title: string; items: string[] }>
  payment: {
    id: string | null
    status: EmployeePaymentStatus
    amount: number
    currency: string
  } | null
}

export type EmployeeDashboardResponse = {
  profile: {
    firstName: string
    lastName: string
    role: string
    salon: string
  }
  metrics: {
    todayCount: number
    weekCount: number
  }
  services: EmployeeService[]
  todayItems: EmployeeScheduleItem[]
}

export type EmployeeScheduleListResponse = {
  items: EmployeeScheduleItem[]
  total: number
}

export type EmployeeScheduleDetailResponse = {
  item: EmployeeScheduleItemDetails
}

export type EmployeeAvailableSlotsResponse = {
  items: Array<{
    id: string
    kind: 'appointment'
    clientName: string
    clientPhone: string | null
    startAt: string
    endAt: string
    service: EmployeeService
    amount: number
    isClaimable: boolean
  }>
  total: number
}

export type EmployeeLeaveRequest = {
  id: string
  startAt: string
  endAt: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  managerNote: string | null
  reviewedAt: string | null
  createdAt: string
}

export type EmployeeLeaveRequestsResponse = {
  items: EmployeeLeaveRequest[]
  total: number
}

export type EmployeeProfile = {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  role: string
  salon: string
}

export type EmployeeProfileResponse = {
  profile: EmployeeProfile
}

export type EmployeeScheduleTab = 'all' | 'upcoming' | 'completed'

type CreateBlockedSlotPayload = {
  startAt: string
  serviceId: string
  clientName: string
  clientPhone: string
  note?: string
}

type CreateLeaveRequestPayload = {
  startAt: string
  endAt: string
  reason: string
}

type UpdateEmployeeProfilePayload = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

async function fetchEmployeeDashboard() {
  const res = await api.get<EmployeeDashboardResponse>('/employee/dashboard')
  return res.data
}

async function fetchEmployeeSchedule(tab: EmployeeScheduleTab) {
  const res = await api.get<EmployeeScheduleListResponse>('/employee/schedule-items', {
    params: { status: tab },
  })
  return res.data
}

async function fetchEmployeeScheduleItem(kind: string, id: string) {
  const res = await api.get<EmployeeScheduleDetailResponse>(`/employee/schedule-items/${kind}/${id}`)
  return res.data
}

async function fetchEmployeeAvailableSlots() {
  const res = await api.get<EmployeeAvailableSlotsResponse>('/employee/available-slots')
  return res.data
}

async function fetchEmployeeLeaveRequests() {
  const res = await api.get<EmployeeLeaveRequestsResponse>('/employee/leave-requests')
  return res.data
}

async function fetchEmployeeProfile() {
  const res = await api.get<EmployeeProfileResponse>('/employee/profile')
  return res.data
}

function invalidateEmployeeQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['employee', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['employee', 'schedule'] }),
    queryClient.invalidateQueries({ queryKey: ['employee', 'available-slots'] }),
    queryClient.invalidateQueries({ queryKey: ['employee', 'leave-requests'] }),
    queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  ])
}

export function useEmployeeDashboard() {
  return useOfflineCachedQuery({
    queryKey: ['employee', 'dashboard'],
    queryFn: fetchEmployeeDashboard,
    cacheKey: 'employee:dashboard',
    staleTime: 30_000,
  })
}

export function useEmployeeSchedule(tab: EmployeeScheduleTab) {
  return useOfflineCachedQuery({
    queryKey: ['employee', 'schedule', tab],
    queryFn: () => fetchEmployeeSchedule(tab),
    cacheKey: `employee:schedule:${tab}`,
  })
}

export function useEmployeeScheduleItem(kind?: string, id?: string) {
  return useOfflineCachedQuery({
    queryKey: ['employee', 'schedule-item', kind, id],
    queryFn: () => fetchEmployeeScheduleItem(kind!, id!),
    cacheKey: `employee:schedule-item:${kind ?? 'unknown'}:${id ?? 'unknown'}`,
    enabled: Boolean(kind && id),
  })
}

export function useEmployeeAvailableSlots() {
  return useQuery({
    queryKey: ['employee', 'available-slots'],
    queryFn: fetchEmployeeAvailableSlots,
  })
}

export function useEmployeeLeaveRequests() {
  return useOfflineCachedQuery({
    queryKey: ['employee', 'leave-requests'],
    queryFn: fetchEmployeeLeaveRequests,
    cacheKey: 'employee:leave-requests',
  })
}

export function useEmployeeProfile() {
  return useOfflineCachedQuery({
    queryKey: ['employee', 'profile'],
    queryFn: fetchEmployeeProfile,
    cacheKey: 'employee:profile',
    staleTime: 30_000,
  })
}

export function useConfirmEmployeeScheduleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ kind, id }: { kind: string; id: string }) => {
      const res = await api.patch(`/employee/schedule-items/${kind}/${id}/confirm`)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateEmployeeQueries(queryClient)
      await queryClient.invalidateQueries({
        queryKey: ['employee', 'schedule-item', variables.kind, variables.id],
      })
    },
  })
}

export function useCompleteEmployeeScheduleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ kind, id }: { kind: string; id: string }) => {
      const res = await api.patch(`/employee/schedule-items/${kind}/${id}/complete`)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateEmployeeQueries(queryClient)
      await queryClient.invalidateQueries({
        queryKey: ['employee', 'schedule-item', variables.kind, variables.id],
      })
    },
  })
}

export function usePayEmployeeScheduleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ kind, id }: { kind: string; id: string }) => {
      const res = await api.patch(`/employee/schedule-items/${kind}/${id}/pay`)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateEmployeeQueries(queryClient)
      await queryClient.invalidateQueries({
        queryKey: ['employee', 'schedule-item', variables.kind, variables.id],
      })
    },
  })
}

export function useCancelEmployeeScheduleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ kind, id }: { kind: string; id: string }) => {
      const res = await api.patch(`/employee/schedule-items/${kind}/${id}/cancel`)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateEmployeeQueries(queryClient)
      await queryClient.invalidateQueries({
        queryKey: ['employee', 'schedule-item', variables.kind, variables.id],
      })
    },
  })
}

export function useClaimEmployeeSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await api.post(`/employee/available-slots/${id}/claim`)
      return res.data
    },
    onSuccess: async () => {
      await invalidateEmployeeQueries(queryClient)
    },
  })
}

export function useCreateEmployeeBlockedSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateBlockedSlotPayload) => {
      const res = await api.post('/employee/blocked-slots', payload)
      return res.data
    },
    onSuccess: async () => {
      await invalidateEmployeeQueries(queryClient)
    },
  })
}

export function useCreateEmployeeLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateLeaveRequestPayload) => {
      const res = await api.post('/employee/leave-requests', payload)
      return res.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employee', 'leave-requests'] })
    },
  })
}

export function useUpdateEmployeeLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: CreateLeaveRequestPayload & { id: string }) => {
      const res = await api.patch(`/employee/leave-requests/${id}`, payload)
      return res.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employee', 'leave-requests'] })
    },
  })
}

export function useCancelEmployeeLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await api.delete(`/employee/leave-requests/${id}`)
      return res.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employee', 'leave-requests'] })
    },
  })
}

export function useUpdateEmployeeProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateEmployeeProfilePayload) => {
      const res = await api.patch<EmployeeProfileResponse>('/employee/profile', payload)
      return res.data
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['employee', 'profile'], data)
      await queryClient.invalidateQueries({ queryKey: ['employee', 'profile'] })
      await queryClient.invalidateQueries({ queryKey: ['employee', 'dashboard'] })
    },
  })
}
