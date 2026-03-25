import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export type AppointmentListResponse = {
  items: Array<{
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    note?: string | null;
    salon: { id: string; name: string };
    service: { id: string; name: string; durationMin: number; price: number };
    employee?: {
      id: string;
      displayName: string;
      specialties?: string[];
      primarySpecialtyLabel?: string | null;
    } | null;
    paymentIntents?: Array<{
      id: string;
      status: string;
      amount: number;
      payableAmount?: number | null;
      currency: string;
      createdAt: string;
    }>;
  }>;
  total: number;
};

export type AppointmentGroupDetails = {
  groupId: string;
  salon: { id: string; name: string };
  canManage: boolean;
  cancellationPolicy: {
    source: string;
    noticeHoursRequired: number;
    noticeHoursRemaining: number;
    refundRate: number;
    refundLabel: string;
  };
  employees: Array<{
    id: string;
    displayName: string;
    specialties: string[];
    primarySpecialtyLabel?: string | null;
  }>;
  items: Array<{
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    note?: string | null;
    service: { id: string; name: string; durationMin: number; price: number };
    employee?: {
      id: string;
      displayName: string;
      specialties?: string[];
      primarySpecialtyLabel?: string | null;
    } | null;
    paymentIntent?: {
      id: string;
      status: string;
      amount: number;
      payableAmount?: number | null;
      discountAmount?: number | null;
      currency: string;
      createdAt: string;
    } | null;
  }>;
};

export type CreateAppointmentPayload = {
  salonId: string;
  serviceId: string;
  startAt: string;
  employeeId?: string;
  note?: string;
};

export async function fetchAppointments() {
  const res = await api.get<AppointmentListResponse>("/appointments");
  return res.data;
}

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,

    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const res = await api.post("/appointments", payload);
  return res.data;
}

export async function assignEmployee(
  appointmentId: string,
  employeeId?: string,
) {
  const res = await api.patch(
    `/appointments/${appointmentId}/assign-employee`,
    { employeeId },
  );
  return res.data;
}

export type CreateAppointmentsFromCartPayload = {
  salonId: string
  startAt: string
  employeeId?: string
  note?: string
  paymentMethod?: 'CARD' | 'MOMO' | 'CASH'
  items: Array<{ serviceId: string; quantity: number }>
}

export async function createAppointmentsFromCart(
  payload: CreateAppointmentsFromCartPayload,
) {
  const res = await api.post('/appointments/from-cart', payload)
  return res.data
}

export async function fetchAppointmentGroupDetails(groupId: string) {
  const res = await api.get<AppointmentGroupDetails>(`/appointments/group/${groupId}`);
  return res.data;
}

export function useAppointmentGroupDetails(groupId?: string) {
  return useQuery({
    queryKey: ["appointments", "group", groupId],
    queryFn: () => fetchAppointmentGroupDetails(groupId!),
    enabled: !!groupId,
  });
}

type UpdateAppointmentGroupPayload = {
  groupId: string;
  startAt?: string;
  employeeId?: string | null;
  reason?: string;
};

export function useUpdateAppointmentGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, ...payload }: UpdateAppointmentGroupPayload) => {
      const res = await api.patch(`/appointments/group/${groupId}`, payload);
      return res.data;
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: ["appointments"] });
      await qc.invalidateQueries({
        queryKey: ["appointments", "group", variables.groupId],
      });
    },
  });
}

export function useCancelAppointmentGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      reason,
    }: {
      groupId: string;
      reason?: string;
    }) => {
      const res = await api.patch(`/appointments/group/${groupId}/cancel`, {
        reason,
      });
      return res.data;
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: ["appointments"] });
      await qc.invalidateQueries({
        queryKey: ["appointments", "group", variables.groupId],
      });
    },
  });
}

export function useCreateAppointmentReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      rating,
      comment,
    }: {
      groupId: string;
      rating: number;
      comment: string;
    }) => {
      const res = await api.post(`/appointments/group/${groupId}/review`, {
        rating,
        comment,
      });
      return res.data;
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: ["appointments"] });
      await qc.invalidateQueries({
        queryKey: ["appointments", "group", variables.groupId],
      });
      await qc.invalidateQueries({ queryKey: ["salons"] });
    },
  });
}
