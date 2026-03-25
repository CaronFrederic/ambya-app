import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

export type AdminDashboardResponse = {
  overview: {
    totalClients: number
    totalProfessionals: number
    totalEmployees: number
    totalAdmins: number
    totalSalons: number
    activeSalons: number
    inactiveSalons: number
    newUsers7d: number
    newUsers30d: number
    activeClients30d: number
    recurrentClients: number
  }
  finance: {
    cashflowGlobal: number
    totalRevenueTreated: number
    ambyaRevenue: number
    ambyaRevenueSharePct: number
    volumeTotalEncaisse: number
    averageBasket: number
    revenueToday: number
    revenueWeek: number
    revenueMonth: number
    revenueBySalon: Array<{ label: string; value: number }>
    topSalonsByRevenue: Array<{ label: string; value: number }>
    topServicesByRevenue: Array<{ label: string; value: number }>
  }
  appointments: {
    total: number
    today: number
    week: number
    month: number
    byStatus: Record<string, number>
    confirmationRate: number
    cancellationRate: number
    noShowRate: number
    completionRate: number
    bySalon: Array<{ label: string; value: number }>
    byEmployee: Array<{ label: string; value: number }>
    byService: Array<{ label: string; value: number }>
  }
  payments: {
    totalTransactions: number
    successful: number
    failed: number
    pending: number
    refunded: number
    successRate: number
    byStatus: Record<string, number>
    byProvider: Array<{ label: string; value: number }>
    problematicTransactions: number
  }
  loyalty: {
    activeAccounts: number
    byTier: Array<{ label: string; value: number }>
  }
  support: {
    alerts: Array<{ label: string; count: number }>
    recentLogs: Array<{
      id: string
      actionType: string
      entityType: string
      entityId: string | null
      actorUserId: string | null
      createdAt: string
    }>
  }
  recentAppointments: Array<{
    id: string
    status: string
    createdAt: string
    salonName: string
    serviceName: string
    clientName: string
  }>
}

export type AdminAccount = {
  id: string
  email: string | null
  phone: string | null
  isActive: boolean
  scope: string
  firstName: string
  lastName: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type AdminUser = {
  id: string
  role: string
  email: string | null
  phone: string | null
  isActive: boolean
  displayName: string
  city: string | null
  country: string | null
  salonName: string | null
  createdAt: string
  clientProfile?: Record<string, unknown> | null
  employeeProfile?: Record<string, unknown> | null
  ownedSalons?: Array<{ id: string; name: string }>
  account?: Record<string, unknown>
  paymentMethods?: Array<Record<string, unknown>>
  loyalty?: Record<string, unknown> | null
  transactions?: Array<Record<string, unknown>>
  appointments?: Array<Record<string, unknown>>
  analytics?: Record<string, unknown>
  recentReviews?: Array<Record<string, unknown>>
}

export type AdminSalon = {
  id: string
  name: string
  city: string | null
  country: string | null
  address: string | null
  phone: string | null
  isActive: boolean
  ownerEmail: string | null
  ownerPhone: string | null
  servicesCount: number
  employeesCount: number
  appointmentsCount: number
  createdAt: string
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  services?: Array<{
    id: string
    name: string
    category: string
    price: number
    durationMin: number
    isActive: boolean
  }>
  employees?: Array<{
    id: string
    displayName: string
    isActive: boolean
    specialties?: string[]
  }>
  owner?: Record<string, unknown>
  professionals?: Array<Record<string, unknown>>
  appointments?: Array<Record<string, unknown>>
  payments?: Array<Record<string, unknown>>
  analytics?: Record<string, unknown>
  recentReviews?: Array<Record<string, unknown>>
}

export type AdminAppointment = {
  id: string
  status: string
  startAt: string
  endAt: string
  note: string | null
  salon: { id: string; name: string }
  service: { id: string; name: string; category: string; price?: number }
  availableEmployees?: Array<{
    id: string
    displayName: string
    specialties: string[]
    primarySpecialtyLabel?: string | null
  }>
  client: {
    id: string
    name: string
    email: string | null
    phone: string | null
    profile?: Record<string, unknown> | null
    loyalty?: Record<string, unknown> | null
    paymentMethods?: Array<Record<string, unknown>>
    recentAppointments?: Array<Record<string, unknown>>
  }
  employee: {
    id: string
    displayName: string
    specialties?: string[]
    primarySpecialtyLabel?: string | null
  } | null
  payment: { id: string; status: string; amount: number; currency: string } | null
  payments?: Array<{
    id: string
    status: string
    amount: number
    currency: string
    provider: string | null
    createdAt: string
  }>
}

export type AuditLogItem = {
  id: string
  actionType: string
  entityType: string
  entityId: string | null
  actorUserId: string | null
  actorRole: string | null
  actorAdminScope: string | null
  requestId: string | null
  route: string | null
  method: string | null
  oldValue: unknown
  newValue: unknown
  metadata: unknown
  createdAt: string
}

async function getDashboard() {
  const res = await api.get<AdminDashboardResponse>('/admin/dashboard')
  return res.data
}

async function getAdmins() {
  const res = await api.get<{ items: AdminAccount[]; total: number }>('/admin/admins')
  return res.data
}

async function getAdmin(id: string) {
  const res = await api.get<{ item: AdminAccount }>(`/admin/admins/${id}`)
  return res.data
}

async function getUsers(params?: Record<string, string | undefined>) {
  const res = await api.get<{ items: AdminUser[]; total: number }>('/admin/users', { params })
  return res.data
}

async function getUser(id: string) {
  const res = await api.get<{ item: AdminUser }>(`/admin/users/${id}`)
  return res.data
}

async function getSalons(params?: Record<string, string | undefined>) {
  const res = await api.get<{ items: AdminSalon[]; total: number }>('/admin/salons', { params })
  return res.data
}

async function getSalon(id: string) {
  const res = await api.get<{ item: AdminSalon }>(`/admin/salons/${id}`)
  return res.data
}

async function getAppointments(params?: Record<string, string | undefined>) {
  const res = await api.get<{ items: AdminAppointment[]; total: number }>('/admin/appointments', { params })
  return res.data
}

async function getAppointment(id: string) {
  const res = await api.get<{ item: AdminAppointment }>(`/admin/appointments/${id}`)
  return res.data
}

async function getAuditLogs(params?: Record<string, string | undefined>) {
  const res = await api.get<{ items: AuditLogItem[]; total: number }>('/admin/audit-logs', { params })
  return res.data
}

function invalidateAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'salons'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
  ])
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getDashboard,
    staleTime: 30_000,
  })
}

export function useAdmins() {
  return useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: getAdmins,
  })
}

export function useAdminAccount(id?: string) {
  return useQuery({
    queryKey: ['admin', 'admins', id],
    queryFn: () => getAdmin(id!),
    enabled: Boolean(id),
  })
}

export function useAdminUsers(params?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['admin', 'users', params ?? {}],
    queryFn: () => getUsers(params),
  })
}

export function useAdminUser(id?: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => getUser(id!),
    enabled: Boolean(id),
  })
}

export function useAdminSalons(params?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['admin', 'salons', params ?? {}],
    queryFn: () => getSalons(params),
  })
}

export function useAdminSalon(id?: string) {
  return useQuery({
    queryKey: ['admin', 'salons', id],
    queryFn: () => getSalon(id!),
    enabled: Boolean(id),
  })
}

export function useAdminAppointments(params?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['admin', 'appointments', params ?? {}],
    queryFn: () => getAppointments(params),
  })
}

export function useAdminAppointment(id?: string) {
  return useQuery({
    queryKey: ['admin', 'appointments', id],
    queryFn: () => getAppointment(id!),
    enabled: Boolean(id),
  })
}

export function useAdminAuditLogs(params?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params ?? {}],
    queryFn: () => getAuditLogs(params),
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/admin/admins', payload)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAdmin(queryClient)
    },
  })
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const res = await api.patch(`/admin/admins/${id}`, payload)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAdmin(queryClient)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'admins', variables.id] })
    },
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const res = await api.patch(`/admin/users/${id}`, payload)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAdmin(queryClient)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.id] })
    },
  })
}

export function useUpdateAdminSalon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const res = await api.patch(`/admin/salons/${id}`, payload)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAdmin(queryClient)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'salons', variables.id] })
    },
  })
}

export function useUpdateAdminAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const res = await api.patch(`/admin/appointments/${id}`, payload)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAdmin(queryClient)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'appointments', variables.id] })
    },
  })
}
