import { EmployeeSpecialty, ServiceCategory } from '@prisma/client'

export const EMPLOYEE_SPECIALTY_LABELS: Record<EmployeeSpecialty, string> = {
  HAIR_STYLIST: 'Coiffeur/Coiffeuse',
  ESTHETICIAN: 'Estheticienne',
  BARBER: 'Barbier',
  MASSAGE_THERAPIST: 'Masseur/Masseuse',
  MANICURIST: 'Manucure',
  FITNESS_COACH: 'Coach sportif',
  OTHER: 'Autre',
}

export const SERVICE_CATEGORY_SPECIALTY_MAP: Record<
  ServiceCategory,
  EmployeeSpecialty[]
> = {
  HAIR: [EmployeeSpecialty.HAIR_STYLIST],
  BARBER: [EmployeeSpecialty.BARBER],
  NAILS: [EmployeeSpecialty.MANICURIST],
  FACE: [EmployeeSpecialty.ESTHETICIAN],
  BODY: [EmployeeSpecialty.MASSAGE_THERAPIST],
  FITNESS: [EmployeeSpecialty.FITNESS_COACH],
  OTHER: [EmployeeSpecialty.OTHER],
}

type SpecialtyLike =
  | EmployeeSpecialty
  | {
      specialty: EmployeeSpecialty
    }

export function normalizeEmployeeSpecialties(
  specialties: SpecialtyLike[],
): EmployeeSpecialty[] {
  return Array.from(
    new Set(
      specialties.map((specialty) =>
        typeof specialty === 'string' ? specialty : specialty.specialty,
      ),
    ),
  )
}

export function getCompatibleSpecialtiesForCategory(
  category: ServiceCategory,
): EmployeeSpecialty[] {
  return SERVICE_CATEGORY_SPECIALTY_MAP[category] ?? [EmployeeSpecialty.OTHER]
}

export function employeeCanPerformCategory(
  specialties: SpecialtyLike[],
  category: ServiceCategory,
): boolean {
  const employeeSpecialties = normalizeEmployeeSpecialties(specialties)
  const compatible = getCompatibleSpecialtiesForCategory(category)
  return compatible.some((specialty) => employeeSpecialties.includes(specialty))
}

export function getEmployeeSpecialtyLabels(
  specialties: SpecialtyLike[],
): string[] {
  return normalizeEmployeeSpecialties(specialties).map(
    (specialty) => EMPLOYEE_SPECIALTY_LABELS[specialty],
  )
}

export function getPrimaryEmployeeSpecialtyLabel(
  specialties: SpecialtyLike[],
): string | null {
  const [first] = getEmployeeSpecialtyLabels(specialties)
  return first ?? null
}
