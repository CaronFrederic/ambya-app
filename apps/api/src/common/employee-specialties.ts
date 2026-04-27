import { EmployeeSpecialty, ServiceCategory } from '@prisma/client'

export const EMPLOYEE_SPECIALTY_LABELS: Record<EmployeeSpecialty, string> = {
  HAIR_STYLIST: 'Coiffeur/Coiffeuse',
  ESTHETICIAN: 'Esthéticienne',
  BARBER: 'Barbier',
  MASSAGE_THERAPIST: 'Masseur/Masseuse',
  MANICURIST: 'Manucure',
  FITNESS_COACH: 'Coach sportif',
  OTHER: 'Autre',
}

export const SERVICE_CATEGORY_SPECIALTY_MAP: Partial<
  Record<ServiceCategory | string, EmployeeSpecialty[]>
> = {
  HAIR: [EmployeeSpecialty.HAIR_STYLIST],
  BARBER: [EmployeeSpecialty.BARBER],
  NAILS: [EmployeeSpecialty.MANICURIST],
  FACE: [EmployeeSpecialty.ESTHETICIAN],
  BODY: [EmployeeSpecialty.MASSAGE_THERAPIST],
  FITNESS: [EmployeeSpecialty.FITNESS_COACH],
  OTHER: [EmployeeSpecialty.OTHER],

  // Compat anciennes catégories Figma / mobile
  beaute: [
    EmployeeSpecialty.HAIR_STYLIST,
    EmployeeSpecialty.ESTHETICIAN,
    EmployeeSpecialty.BARBER,
    EmployeeSpecialty.MANICURIST,
  ],
  bienetre: [
    EmployeeSpecialty.MASSAGE_THERAPIST,
    EmployeeSpecialty.ESTHETICIAN,
  ],
  formation: [EmployeeSpecialty.OTHER],
}

type SpecialtyLike =
  | EmployeeSpecialty
  | {
      specialty: EmployeeSpecialty
    }

export function normalizeEmployeeSpecialties(
  specialties: SpecialtyLike[] = [],
): EmployeeSpecialty[] {
  return Array.from(
    new Set(
      specialties.map((item) =>
        typeof item === 'string' ? item : item.specialty,
      ),
    ),
  )
}

export function getCompatibleSpecialtiesForCategory(
  category?: ServiceCategory | string | null,
): EmployeeSpecialty[] {
  if (!category) return [EmployeeSpecialty.OTHER]

  return (
    SERVICE_CATEGORY_SPECIALTY_MAP[category] ??
    SERVICE_CATEGORY_SPECIALTY_MAP[String(category).toUpperCase()] ??
    SERVICE_CATEGORY_SPECIALTY_MAP[String(category).toLowerCase()] ??
    [EmployeeSpecialty.OTHER]
  )
}

export function employeeCanPerformCategory(
  specialties: SpecialtyLike[] = [],
  category?: ServiceCategory | string | null,
): boolean {
  const employeeSpecialties = normalizeEmployeeSpecialties(specialties)
  const compatible = getCompatibleSpecialtiesForCategory(category)

  return compatible.some((specialty) => employeeSpecialties.includes(specialty))
}

export function getEmployeeSpecialtyLabels(
  specialties: SpecialtyLike[] = [],
): string[] {
  return normalizeEmployeeSpecialties(specialties).map(
    (specialty) => EMPLOYEE_SPECIALTY_LABELS[specialty],
  )
}

export function getPrimaryEmployeeSpecialtyLabel(
  specialties: SpecialtyLike[] = [],
): string | null {
  const [first] = getEmployeeSpecialtyLabels(specialties)
  return first ?? null
}