export const DEFAULT_SALON_TIME_ZONE = 'Africa/Libreville'

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function resolveSalonTimeZone(timeZone?: string | null) {
  const normalized = timeZone?.trim()
  return normalized || DEFAULT_SALON_TIME_ZONE
}

function getZonedParts(value: Date, timeZone?: string | null) {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: resolveSalonTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(value)
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
  }
}

export function formatDateInTimeZone(
  value: string | Date,
  timeZone?: string | null,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString('fr-FR', {
    timeZone: resolveSalonTimeZone(timeZone),
    ...options,
  })
}

export function formatTimeInTimeZone(value: string | Date, timeZone?: string | null) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: resolveSalonTimeZone(timeZone),
  })
}

export function formatDateKeyInTimeZone(
  value: string | Date,
  timeZone?: string | null,
) {
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = getZonedParts(date, timeZone)
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

export function formatTimeKeyInTimeZone(
  value: string | Date,
  timeZone?: string | null,
) {
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = getZonedParts(date, timeZone)
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`
}

export function isPastDateInTimeZone(
  dateIso: string,
  timeZone?: string | null,
  now = new Date(),
) {
  return dateIso < formatDateKeyInTimeZone(now, timeZone)
}

export function isPastOrCurrentSlotInTimeZone(
  dateIso: string,
  time: string,
  timeZone?: string | null,
  now = new Date(),
) {
  const todayIso = formatDateKeyInTimeZone(now, timeZone)
  if (dateIso !== todayIso) return dateIso < todayIso
  return time <= formatTimeKeyInTimeZone(now, timeZone)
}

export function zonedDateTimeToUtcIso(
  dateIso: string,
  time: string,
  timeZone?: string | null,
) {
  const [year, month, day] = dateIso.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null
  }

  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  let candidate = new Date(targetAsUtc)

  for (let i = 0; i < 3; i += 1) {
    const parts = getZonedParts(candidate, timeZone)
    const candidateAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      0,
      0,
    )
    candidate = new Date(candidate.getTime() + (targetAsUtc - candidateAsUtc))
  }

  return candidate.toISOString()
}

