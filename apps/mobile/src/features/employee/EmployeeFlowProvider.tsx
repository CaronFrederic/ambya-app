import React, { createContext, useContext, useMemo, useState } from 'react'

import {
  BlockedSlot,
  EmployeeAppointment,
  EmployeeProfile,
  LeaveRequest,
  initialAvailableSlots,
  initialEmployeeAppointments,
  initialEmployeeProfile,
  initialLeaveRequests,
} from './data'

type CreateLeavePayload = {
  startDate: string
  endDate: string
  reason: string
}

type BlockSlotPayload = {
  date: string
  time: string
  service: string
  clientName: string
  phone: string
  note?: string
}

type EmployeeFlowContextValue = {
  profile: EmployeeProfile
  appointments: EmployeeAppointment[]
  leaveRequests: LeaveRequest[]
  availableSlots: typeof initialAvailableSlots
  blockedSlots: BlockedSlot[]
  updateProfile: (payload: Partial<EmployeeProfile>) => void
  createLeaveRequest: (payload: CreateLeavePayload) => void
  blockSlot: (payload: BlockSlotPayload) => void
  assignSlot: (slotId: string) => void
  markAppointmentCompleted: (appointmentId: string) => void
  markAppointmentPaid: (appointmentId: string) => void
  findAppointment: (appointmentId: string) => EmployeeAppointment | undefined
}

const EmployeeFlowContext = createContext<EmployeeFlowContextValue | null>(null)

export function EmployeeFlowProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState(initialEmployeeProfile)
  const [appointments, setAppointments] = useState(initialEmployeeAppointments)
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests)
  const [availableSlots, setAvailableSlots] = useState(initialAvailableSlots)
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])

  const value = useMemo<EmployeeFlowContextValue>(
    () => ({
      profile,
      appointments,
      leaveRequests,
      availableSlots,
      blockedSlots,
      updateProfile: (payload) => {
        setProfile((current) => ({ ...current, ...payload }))
      },
      createLeaveRequest: ({ startDate, endDate, reason }) => {
        const durationDays = computeDaySpan(startDate, endDate)

        setLeaveRequests((current) => [
          {
            id: `leave-${Date.now()}`,
            title: reason.trim() || 'Nouvelle demande',
            period: `${startDate} - ${endDate}`,
            duration: `${durationDays} jour${durationDays > 1 ? 's' : ''}`,
            status: 'pending',
          },
          ...current,
        ])
      },
      blockSlot: ({ date, time, service, clientName, phone, note }) => {
        setBlockedSlots((current) => [
          {
            id: `blocked-${Date.now()}`,
            date,
            time,
            service,
            clientName,
            phone,
            note,
          },
          ...current,
        ])
      },
      assignSlot: (slotId) => {
        setAvailableSlots((current) => current.filter((slot) => slot.id !== slotId))
      },
      markAppointmentCompleted: (appointmentId) => {
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === appointmentId
              ? { ...appointment, status: 'completed' }
              : appointment,
          ),
        )
      },
      markAppointmentPaid: (appointmentId) => {
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === appointmentId
              ? { ...appointment, paid: true }
              : appointment,
          ),
        )
      },
      findAppointment: (appointmentId) =>
        appointments.find((appointment) => appointment.id === appointmentId),
    }),
    [appointments, availableSlots, blockedSlots, leaveRequests, profile],
  )

  return (
    <EmployeeFlowContext.Provider value={value}>
      {children}
    </EmployeeFlowContext.Provider>
  )
}

export function useEmployeeFlow() {
  const context = useContext(EmployeeFlowContext)

  if (!context) {
    throw new Error('useEmployeeFlow must be used inside EmployeeFlowProvider')
  }

  return context
}

function computeDaySpan(startDate: string, endDate: string) {
  const [startDay, startMonth, startYear] = startDate.split('/').map(Number)
  const [endDay, endMonth, endYear] = endDate.split('/').map(Number)

  const start = new Date(startYear, startMonth - 1, startDay)
  const end = new Date(endYear, endMonth - 1, endDay)
  const delta = end.getTime() - start.getTime()
  const days = Math.floor(delta / (1000 * 60 * 60 * 24)) + 1

  return days > 0 ? days : 1
}
