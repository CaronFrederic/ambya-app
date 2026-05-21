export type CountryOption = {
  code: string
  name: string
  currency: string
}

export const AVAILABLE_COUNTRIES: CountryOption[] = [
  { code: 'GA', name: 'Gabon', currency: 'FCFA' },
  { code: 'CD', name: 'RDC', currency: '$' },
  { code: 'CG', name: 'Congo', currency: 'FCFA' },
  { code: 'CM', name: 'Cameroun', currency: 'FCFA' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'FCFA' },
]

export const ACTIVE_COUNTRY_CODES = ['GA'] as const
export const DEFAULT_COUNTRY_CODE = 'GA'
export const DEFAULT_COUNTRY_NAME = 'Gabon'
export const DEFAULT_CURRENCY = 'FCFA'
export const GABON_CALLING_CODE = '+241'
export const GABON_MOBILE_MONEY_PROVIDERS = [
  'Moov Money',
  'Airtel Money',
  'Mobicash',
] as const

export const FALLBACK_COUNTRIES = AVAILABLE_COUNTRIES

export function getEnabledCountries(
  countries: CountryOption[] = AVAILABLE_COUNTRIES,
) {
  const activeCodes = new Set(ACTIVE_COUNTRY_CODES)
  const filtered = countries.filter((country) => activeCodes.has(country.code as (typeof ACTIVE_COUNTRY_CODES)[number]))
  return filtered.length ? filtered : AVAILABLE_COUNTRIES.filter((country) => activeCodes.has(country.code as (typeof ACTIVE_COUNTRY_CODES)[number]))
}

export function getDefaultCountry(countries?: CountryOption[]) {
  return (
    getEnabledCountries(countries).find((country) => country.code === DEFAULT_COUNTRY_CODE) ?? {
      code: DEFAULT_COUNTRY_CODE,
      name: DEFAULT_COUNTRY_NAME,
      currency: DEFAULT_CURRENCY,
    }
  )
}

export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function getGabonNationalPhoneDigits(value: string) {
  const digits = normalizePhoneDigits(value)
  if (digits.startsWith('241')) {
    return digits.slice(3, 12)
  }
  return digits.slice(0, 9)
}

export function isValidGabonPhone(value: string) {
  return getGabonNationalPhoneDigits(value).length === 9
}

export function formatGabonPhone(value: string) {
  const nationalDigits = getGabonNationalPhoneDigits(value)
  const parts = [
    nationalDigits.slice(0, 3),
    nationalDigits.slice(3, 5),
    nationalDigits.slice(5, 7),
    nationalDigits.slice(7, 9),
  ].filter(Boolean)
  return parts.join(' ')
}

export function formatGabonPhoneIntl(value: string) {
  const formatted = formatGabonPhone(value)
  return formatted ? `${GABON_CALLING_CODE} ${formatted}` : GABON_CALLING_CODE
}

export function buildGabonPhoneHint() {
  return `Saisissez un numéro gabonais valide à 9 chiffres. Exemple : ${formatGabonPhoneIntl('077123456')}.`
}
