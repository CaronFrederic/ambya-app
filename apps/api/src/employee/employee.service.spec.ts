import { ServiceCategory } from '@prisma/client'
import { EmployeeService } from './employee.service'

describe('EmployeeService', () => {
  let service: EmployeeService

  beforeEach(() => {
    service = new EmployeeService({} as any)
  })

  it('maps the employee tab correctly for upcoming and completed appointments', () => {
    expect((service as any).matchesEmployeeTab('PENDING', 'upcoming')).toBe(true)
    expect((service as any).matchesEmployeeTab('CONFIRMED', 'upcoming')).toBe(true)
    expect((service as any).matchesEmployeeTab('COMPLETED', 'upcoming')).toBe(false)
    expect((service as any).matchesEmployeeTab('COMPLETED', 'completed')).toBe(true)
  })

  it('builds role labels from employee specialties', () => {
    expect(
      (service as any).getEmployeeRoleLabel([{ specialty: 'MASSAGE_THERAPIST' }]),
    ).toBe('Masseur/Masseuse')

    expect(
      (service as any).getEmployeeRoleLabel([
        { specialty: 'HAIR_STYLIST' },
        { specialty: 'BARBER' },
      ]),
    ).toBe('Coiffeur/Coiffeuse, Barbier')
  })

  it('builds useful body insights for wellbeing appointments', () => {
    const result = (service as any).buildClientInsights(
      ServiceCategory.BODY,
      {
        body: {
          bodySkin: 'normal',
          tensionZones: ['back', 'lower_back'],
          wellbeingConcerns: ['detox'],
          massageSensitiveZones: ['neck'],
        },
      },
      'sensitive_products',
      'Cliente sensible aux pressions fortes',
    )

    expect(result).toEqual([
      {
        title: 'Profil bien-etre',
        items: [
          'Type de peau (corps): Normale',
          'Zones de tension: Dos, Lombaires',
          'Preoccupations: Detox',
          'Zones sensibles massage: Nuque',
        ],
      },
      {
        title: 'Informations importantes',
        items: [
          'Allergies: Sensitive Products',
          'Commentaires: Cliente sensible aux pressions fortes',
        ],
      },
    ])
  })

  it('removes technical booking group tags from appointment notes', () => {
    const result = (service as any).sanitizeAppointmentNote(
      '[BOOKING_GROUP:cart-123] Massage detente',
    )

    expect(result).toBe('Massage detente')
  })
})
