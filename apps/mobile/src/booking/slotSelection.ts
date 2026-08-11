import {
  formatDateKeyInTimeZone,
  isPastDateInTimeZone,
  isPastOrCurrentSlotInTimeZone,
} from '../utils/dateTime'

export type AvailabilitySlot = {
  time: string
  available: boolean
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function toLocalDateIso(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function parseLocalSlotStart(dateIso: string, time: string) {
  const [year, month, day] = dateIso.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null
  }

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function toDateIsoInTimeZone(date: Date, timeZone?: string | null) {
  return formatDateKeyInTimeZone(date, timeZone)
}

export function isPastOrCurrentSlot(
  dateIso: string,
  time: string,
  now = new Date(),
  timeZone?: string | null,
) {
  if (timeZone) {
    return isPastOrCurrentSlotInTimeZone(dateIso, time, timeZone, now)
  }

  const slotStart = parseLocalSlotStart(dateIso, time)
  if (!slotStart) return true
  return slotStart.getTime() <= now.getTime()
}

export function isPastLocalDate(
  dateIso: string,
  now = new Date(),
  timeZone?: string | null,
) {
  if (timeZone) return isPastDateInTimeZone(dateIso, timeZone, now)

  const [year, month, day] = dateIso.split('-').map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  if (Number.isNaN(date.getTime())) return true

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return date.getTime() < today.getTime()
}

export function getBookableSlots(
  slots: AvailabilitySlot[],
  dateIso: string,
  now = new Date(),
  timeZone?: string | null,
) {
  return slots.filter(
    (slot) =>
      slot.available &&
      !isPastOrCurrentSlot(dateIso, slot.time, now, timeZone),
  )
}

export function getNextSlotInvalidationDelayMs(
  slots: AvailabilitySlot[],
  dateIso: string,
  now = new Date(),
  timeZone?: string | null,
) {
  if (timeZone) {
    const hasFutureSlot = slots.some(
      (slot) => !isPastOrCurrentSlotInTimeZone(dateIso, slot.time, timeZone, now),
    )
    return hasFutureSlot ? 60_000 : null
  }

  const nextStart = slots
    .map((slot) => parseLocalSlotStart(dateIso, slot.time))
    .filter((date): date is Date => Boolean(date))
    .map((date) => date.getTime())
    .filter((time) => time > now.getTime())
    .sort((a, b) => a - b)[0]

  if (!nextStart) return null
  return Math.max(nextStart - now.getTime() + 1000, 1000)
}
