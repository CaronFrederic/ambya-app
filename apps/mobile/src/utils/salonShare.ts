const AMBYA_PUBLIC_ORIGIN = 'https://ambya.app'

export function buildSalonShareUrl(salonId?: string | null) {
  const normalizedSalonId = salonId?.trim()

  if (!normalizedSalonId) {
    return null
  }

  return `${AMBYA_PUBLIC_ORIGIN}/salons/${encodeURIComponent(normalizedSalonId)}`
}

export function buildSalonShareMessage(params: {
  salonId?: string | null
  salonName?: string | null
}) {
  const url = buildSalonShareUrl(params.salonId)

  if (!url) {
    return null
  }

  const salonName = params.salonName?.trim() || 'ce salon'

  return {
    url,
    message: `Découvrez ${salonName} sur Ambya : ${url}`,
  }
}
