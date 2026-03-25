import 'dotenv/config'
import {
  AppointmentStatus,
  EmployeeSpecialty,
  LeaveRequestStatus,
  LoyaltyTier,
  PaymentStatus,
  PaymentType,
  PrismaClient,
  ServiceCategory,
  UserRole,
} from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})

async function main() {
  console.log('Seeding beta-ready demo data for Client + Employee...')

  const passwordHash = await bcrypt.hash('password123', 10)

  await ensureBetaSchemaCompat()
  await ensureCountries()

  const professional = await prisma.user.upsert({
    where: { email: 'pro.beta@ambya.com' },
    update: {
      password: passwordHash,
      role: UserRole.PROFESSIONAL,
      isActive: true,
    },
    create: {
      email: 'pro.beta@ambya.com',
      password: passwordHash,
      role: UserRole.PROFESSIONAL,
      isActive: true,
      phone: '+24170000001',
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'client.beta@ambya.com' },
    update: {
      password: passwordHash,
      role: UserRole.CLIENT,
      isActive: true,
      phone: '+24170000010',
    },
    create: {
      email: 'client.beta@ambya.com',
      password: passwordHash,
      role: UserRole.CLIENT,
      isActive: true,
      phone: '+24170000010',
    },
  })

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee.beta@ambya.com' },
    update: {
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      phone: '+24170000020',
    },
    create: {
      email: 'employee.beta@ambya.com',
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      phone: '+24170000020',
    },
  })

  const secondEmployeeUser = await prisma.user.upsert({
    where: { email: 'employee2.beta@ambya.com' },
    update: {
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      phone: '+24170000021',
    },
    create: {
      email: 'employee2.beta@ambya.com',
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      phone: '+24170000021',
    },
  })

  const salon = await ensureSalon(professional.id)

  const employee = await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: {
      salonId: salon.id,
      displayName: 'Sarah Beta',
      firstName: 'Sarah',
      lastName: 'Beta',
      isActive: true,
    },
    create: {
      salonId: salon.id,
      userId: employeeUser.id,
      displayName: 'Sarah Beta',
      firstName: 'Sarah',
      lastName: 'Beta',
      isActive: true,
    },
  })

  const secondEmployee = await prisma.employee.upsert({
    where: { userId: secondEmployeeUser.id },
    update: {
      salonId: salon.id,
      displayName: 'Naomi Beta',
      firstName: 'Naomi',
      lastName: 'Beta',
      isActive: true,
    },
    create: {
      salonId: salon.id,
      userId: secondEmployeeUser.id,
      displayName: 'Naomi Beta',
      firstName: 'Naomi',
      lastName: 'Beta',
      isActive: true,
    },
  })

  await syncEmployeeSpecialties(employee.id, [
    EmployeeSpecialty.HAIR_STYLIST,
    EmployeeSpecialty.BARBER,
  ])

  await syncEmployeeSpecialties(secondEmployee.id, [
    EmployeeSpecialty.ESTHETICIAN,
    EmployeeSpecialty.MANICURIST,
    EmployeeSpecialty.MASSAGE_THERAPIST,
    EmployeeSpecialty.FITNESS_COACH,
  ])

  await prisma.clientProfile.upsert({
    where: { userId: client.id },
    update: {
      nickname: 'Amina',
      gender: 'female',
      ageRange: '25-34',
      city: 'Libreville',
      country: 'Gabon',
      allergies: 'huiles essentielles fortes',
      comments: 'Cheveux sensibilises sur les pointes',
      questionnaire: {
        hair: {
          texture: 'frises',
          scalpSensitivity: 'oui',
          routine: ['hydration', 'protective_style'],
          goals: 'definir les boucles sans chaleur',
        },
        nails: {
          sensitivity: 'moyenne',
          preferences: ['nude', 'court'],
        },
        face: {
          skinType: 'mixte',
          concerns: ['hydratation', 'eclat'],
        },
        body: {
          pressure: 'douce',
          focusAreas: ['epaules', 'dos'],
        },
        fitness: {
          activityLevel: 'debutant',
          objective: 'remise en forme',
        },
      },
    },
    create: {
      userId: client.id,
      nickname: 'Amina',
      gender: 'female',
      ageRange: '25-34',
      city: 'Libreville',
      country: 'Gabon',
      allergies: 'huiles essentielles fortes',
      comments: 'Cheveux sensibilises sur les pointes',
      questionnaire: {
        hair: {
          texture: 'frises',
          scalpSensitivity: 'oui',
          routine: ['hydration', 'protective_style'],
          goals: 'definir les boucles sans chaleur',
        },
        nails: {
          sensitivity: 'moyenne',
          preferences: ['nude', 'court'],
        },
        face: {
          skinType: 'mixte',
          concerns: ['hydratation', 'eclat'],
        },
        body: {
          pressure: 'douce',
          focusAreas: ['epaules', 'dos'],
        },
        fitness: {
          activityLevel: 'debutant',
          objective: 'remise en forme',
        },
      },
    },
  })

  await prisma.loyaltyAccount.upsert({
    where: { userId: client.id },
    update: {
      tier: LoyaltyTier.SILVER,
      currentPoints: 180,
      lifetimePoints: 420,
      pendingDiscountAmount: 3000,
      pendingDiscountTier: LoyaltyTier.SILVER,
      pendingDiscountIssuedAt: new Date(),
    },
    create: {
      userId: client.id,
      tier: LoyaltyTier.SILVER,
      currentPoints: 180,
      lifetimePoints: 420,
      pendingDiscountAmount: 3000,
      pendingDiscountTier: LoyaltyTier.SILVER,
      pendingDiscountIssuedAt: new Date(),
    },
  })

  await upsertPaymentMethod(client.id, {
    type: PaymentType.CARD,
    provider: 'Visa',
    last4: '4242',
    label: 'Visa beta',
    isDefault: true,
  })
  await upsertPaymentMethod(client.id, {
    type: PaymentType.MOMO,
    provider: 'MTN',
    phone: '+24170000010',
    label: 'Mobile Money beta',
    isDefault: false,
  })

  const services = await ensureServices(salon.id)

  await prisma.salonReview.deleteMany({ where: { salonId: salon.id } })
  await prisma.salonReview.createMany({
    data: [
      {
        salonId: salon.id,
        clientId: client.id,
        rating: 5,
        comment: 'Salon parfait pour une beta de demo.',
      },
      {
        salonId: salon.id,
        clientId: client.id,
        rating: 4,
        comment: 'Accueil chaleureux et ponctuel.',
      },
    ],
    skipDuplicates: true,
  })

  await cleanupDemoOperationalData(salon.id, client.id, [employee.id, secondEmployee.id])

  const now = new Date()
  const tomorrowAt10 = atUtc(now, 1, 10, 0)
  const tomorrowAt11 = atUtc(now, 1, 11, 0)
  const tomorrowAt15 = atUtc(now, 1, 15, 0)
  const tomorrowAt16 = atUtc(now, 1, 16, 0)
  const tomorrowAt17 = atUtc(now, 1, 17, 0)
  const afterTomorrowAt10 = atUtc(now, 2, 10, 0)
  const afterTomorrowAt14 = atUtc(now, 2, 14, 0)
  const threeDaysAgoAt9 = atUtc(now, -3, 9, 0)

  const bookingGroupId = 'beta-client-group-1'
  const hairService = services.hair
  const faceService = services.face
  const bodyService = services.body
  const nailsService = services.nails
  const barberService = services.barber

  const groupedAppointment1 = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: hairService.id,
      employeeId: employee.id,
      status: AppointmentStatus.PENDING,
      startAt: tomorrowAt10,
      endAt: addMinutes(tomorrowAt10, hairService.durationMin),
      note: `[BOOKING_GROUP:${bookingGroupId}] Bundle coiffure beta`,
    },
  })

  const groupedAppointment2 = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: faceService.id,
      employeeId: secondEmployee.id,
      status: AppointmentStatus.PENDING,
      startAt: addMinutes(tomorrowAt10, hairService.durationMin),
      endAt: addMinutes(addMinutes(tomorrowAt10, hairService.durationMin), faceService.durationMin),
      note: `[BOOKING_GROUP:${bookingGroupId}] Bundle coiffure beta`,
    },
  })

  await prisma.paymentIntent.createMany({
    data: [
      {
        userId: client.id,
        salonId: salon.id,
        appointmentId: groupedAppointment1.id,
        amount: hairService.price,
        discountAmount: 0,
        payableAmount: hairService.price,
        currency: 'XAF',
        status: PaymentStatus.CREATED,
        platformFeeAmount: 0,
        providerFeeAmount: 0,
        netAmount: hairService.price,
      },
      {
        userId: client.id,
        salonId: salon.id,
        appointmentId: groupedAppointment2.id,
        amount: faceService.price,
        discountAmount: 0,
        payableAmount: faceService.price,
        currency: 'XAF',
        status: PaymentStatus.CREATED,
        platformFeeAmount: 0,
        providerFeeAmount: 0,
        netAmount: faceService.price,
      },
    ],
  })

  const availableAppointment = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: barberService.id,
      employeeId: null,
      status: AppointmentStatus.PENDING,
      startAt: tomorrowAt15,
      endAt: addMinutes(tomorrowAt15, barberService.durationMin),
      note: '[BOOKING_GROUP:beta-available-slot] Creneau disponible employee',
    },
  })

  await prisma.paymentIntent.create({
    data: {
      userId: client.id,
      salonId: salon.id,
      appointmentId: availableAppointment.id,
      amount: barberService.price,
      discountAmount: 0,
      payableAmount: barberService.price,
      currency: 'XAF',
      status: PaymentStatus.CREATED,
      platformFeeAmount: 0,
      providerFeeAmount: 0,
      netAmount: barberService.price,
    },
  })

  const confirmedAppointment = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: barberService.id,
      employeeId: employee.id,
      status: AppointmentStatus.CONFIRMED,
      startAt: tomorrowAt17,
      endAt: addMinutes(tomorrowAt17, barberService.durationMin),
      note: '[BOOKING_GROUP:beta-confirmed] Barbier confirme',
    },
  })

  await prisma.paymentIntent.create({
    data: {
      userId: client.id,
      salonId: salon.id,
      appointmentId: confirmedAppointment.id,
      amount: barberService.price,
      discountAmount: 0,
      payableAmount: barberService.price,
      currency: 'XAF',
      status: PaymentStatus.SUCCEEDED,
      provider: 'INTERNAL_BETA',
      providerRef: `seed-confirmed-${confirmedAppointment.id}`,
      providerData: { source: 'seed_beta' },
      platformFeeAmount: 0,
      providerFeeAmount: 0,
      netAmount: barberService.price,
    },
  })

  const completedAppointment = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: hairService.id,
      employeeId: employee.id,
      status: AppointmentStatus.COMPLETED,
      startAt: threeDaysAgoAt9,
      endAt: addMinutes(threeDaysAgoAt9, hairService.durationMin),
      note: '[BOOKING_GROUP:beta-completed] Coupe terminee',
    },
  })

  await prisma.paymentIntent.create({
    data: {
      userId: client.id,
      salonId: salon.id,
      appointmentId: completedAppointment.id,
      amount: hairService.price,
      discountAmount: 0,
      payableAmount: hairService.price,
      currency: 'XAF',
      status: PaymentStatus.SUCCEEDED,
      provider: 'INTERNAL_BETA',
      providerRef: `seed-completed-${completedAppointment.id}`,
      providerData: { source: 'seed_beta' },
      platformFeeAmount: 0,
      providerFeeAmount: 0,
      netAmount: hairService.price,
    },
  })

  await prisma.employeeBlockedSlot.create({
    data: {
      salonId: salon.id,
      employeeId: employee.id,
      serviceId: hairService.id,
      clientName: 'Cliente Walk-in',
      clientPhone: '+24170000030',
      note: 'Cliente venue directement au salon.',
      startAt: afterTomorrowAt10,
      endAt: addMinutes(afterTomorrowAt10, hairService.durationMin),
      status: AppointmentStatus.CONFIRMED,
      isPaid: false,
    },
  })

  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: employee.id,
        startAt: afterTomorrowAt14,
        endAt: addMinutes(afterTomorrowAt14, 60 * 24),
        reason: 'Conges annuels',
        status: LeaveRequestStatus.PENDING,
      },
      {
        employeeId: employee.id,
        startAt: addMinutes(afterTomorrowAt14, 60 * 48),
        endAt: addMinutes(afterTomorrowAt14, 60 * 72),
        reason: 'Evenement familial',
        status: LeaveRequestStatus.APPROVED,
        reviewedAt: new Date(),
        managerNote: 'Valide pour la semaine prochaine.',
      },
    ],
  })

  await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: faceService.id,
      employeeId: secondEmployee.id,
      status: AppointmentStatus.CONFIRMED,
      startAt: tomorrowAt16,
      endAt: addMinutes(tomorrowAt16, faceService.durationMin),
      note: '[BOOKING_GROUP:beta-other-employee] Conflit agenda demo',
    },
  })

  console.log('Beta-ready seed completed.')
  console.log('Client: client.beta@ambya.com / password123')
  console.log('Employee: employee.beta@ambya.com / password123')
  console.log('Salon owner: pro.beta@ambya.com / password123')
}

async function ensureCountries() {
  await prisma.country.upsert({
    where: { code: 'GA' },
    update: { name: 'Gabon', currency: 'FCFA', isActive: true },
    create: { code: 'GA', name: 'Gabon', currency: 'FCFA', isActive: true },
  })

  await prisma.country.upsert({
    where: { code: 'CD' },
    update: { name: 'RDC', currency: '$', isActive: true },
    create: { code: 'CD', name: 'RDC', currency: '$', isActive: true },
  })
}

async function ensureBetaSchemaCompat() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceCategory') THEN
        CREATE TYPE "ServiceCategory" AS ENUM ('HAIR', 'BARBER', 'NAILS', 'FACE', 'BODY', 'FITNESS', 'OTHER');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveRequestStatus') THEN
        CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmployeeSpecialty') THEN
        CREATE TYPE "EmployeeSpecialty" AS ENUM (
          'HAIR_STYLIST',
          'ESTHETICIAN',
          'BARBER',
          'MASSAGE_THERAPIST',
          'MANICURIST',
          'FITNESS_COACH',
          'OTHER'
        );
      END IF;
    END $$;
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Employee"
      ADD COLUMN IF NOT EXISTS "firstName" TEXT,
      ADD COLUMN IF NOT EXISTS "lastName" TEXT;
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Service"
      ADD COLUMN IF NOT EXISTS "category" "ServiceCategory" NOT NULL DEFAULT 'OTHER';
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Salon"
      ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EmployeeBlockedSlot" (
      "id" TEXT NOT NULL,
      "salonId" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "serviceId" TEXT NOT NULL,
      "clientName" TEXT NOT NULL,
      "clientPhone" TEXT NOT NULL,
      "note" TEXT,
      "startAt" TIMESTAMP(3) NOT NULL,
      "endAt" TIMESTAMP(3) NOT NULL,
      "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
      "isPaid" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "EmployeeBlockedSlot_pkey" PRIMARY KEY ("id")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LeaveRequest" (
      "id" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "startAt" TIMESTAMP(3) NOT NULL,
      "endAt" TIMESTAMP(3) NOT NULL,
      "reason" TEXT NOT NULL,
      "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
      "reviewedAt" TIMESTAMP(3),
      "managerNote" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EmployeeSpecialtyAssignment" (
      "id" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "specialty" "EmployeeSpecialty" NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EmployeeSpecialtyAssignment_pkey" PRIMARY KEY ("id")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeSpecialtyAssignment_employeeId_specialty_key"
      ON "EmployeeSpecialtyAssignment"("employeeId", "specialty");
  `)
}

async function ensureSalon(ownerId: string) {
  const existing = await prisma.salon.findFirst({
    where: { ownerId, name: 'Ambya Beta Studio' },
  })

  if (existing) {
    return prisma.salon.update({
      where: { id: existing.id },
      data: {
        description: 'Salon de demonstration pour les flows Client et Employee.',
        address: '12 Boulevard Triomphal',
        city: 'Libreville',
        country: 'Gabon',
        latitude: 0.4162,
        longitude: 9.4673,
        phone: '+24170000100',
        coverImageUrl:
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
        galleryImageUrls: [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=700&q=80',
          'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=700&q=80',
        ],
        socialLinks: {
          instagram: 'https://instagram.com/ambya.beta',
          facebook: 'https://facebook.com/ambya.beta',
        },
      },
    })
  }

  return prisma.salon.create({
    data: {
      ownerId,
      name: 'Ambya Beta Studio',
      description: 'Salon de demonstration pour les flows Client et Employee.',
      address: '12 Boulevard Triomphal',
      city: 'Libreville',
      country: 'Gabon',
      latitude: 0.4162,
      longitude: 9.4673,
      phone: '+24170000100',
      coverImageUrl:
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
      galleryImageUrls: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=700&q=80',
        'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=700&q=80',
      ],
      socialLinks: {
        instagram: 'https://instagram.com/ambya.beta',
        facebook: 'https://facebook.com/ambya.beta',
      },
    },
  })
}

async function ensureServices(salonId: string) {
  const definitions = [
    {
      key: 'hair',
      name: 'Coupe Signature',
      category: ServiceCategory.HAIR,
      price: 15000,
      durationMin: 45,
      description: 'Coupe et mise en forme.',
    },
    {
      key: 'face',
      name: 'Glow Skin',
      category: ServiceCategory.FACE,
      price: 12000,
      durationMin: 30,
      description: 'Soin visage express.',
    },
    {
      key: 'body',
      name: 'Massage Equilibre',
      category: ServiceCategory.BODY,
      price: 22000,
      durationMin: 60,
      description: 'Massage bien-etre relaxant.',
    },
    {
      key: 'nails',
      name: 'Manucure Soin',
      category: ServiceCategory.NAILS,
      price: 10000,
      durationMin: 35,
      description: 'Manucure complete.',
    },
    {
      key: 'barber',
      name: 'Barbe Precision',
      category: ServiceCategory.BARBER,
      price: 13000,
      durationMin: 30,
      description: 'Taille et entretien de la barbe.',
    },
    {
      key: 'fitness',
      name: 'Coaching Flash',
      category: ServiceCategory.FITNESS,
      price: 18000,
      durationMin: 45,
      description: 'Session coaching bien-etre.',
    },
  ] as const

  const entries = await Promise.all(
    definitions.map(async (definition) => {
      const service = await prisma.service.upsert({
        where: { salonId_name: { salonId, name: definition.name } },
        update: {
          category: definition.category,
          price: definition.price,
          durationMin: definition.durationMin,
          description: definition.description,
          isActive: true,
        },
        create: {
          salonId,
          name: definition.name,
          category: definition.category,
          price: definition.price,
          durationMin: definition.durationMin,
          description: definition.description,
          isActive: true,
        },
      })
      return [definition.key, service] as const
    }),
  )

  return Object.fromEntries(entries) as Record<(typeof definitions)[number]['key'], Awaited<ReturnType<typeof prisma.service.upsert>>>
}

async function syncEmployeeSpecialties(
  employeeId: string,
  specialties: EmployeeSpecialty[],
) {
  await prisma.employeeSpecialtyAssignment.deleteMany({
    where: { employeeId },
  })

  await prisma.employeeSpecialtyAssignment.createMany({
    data: specialties.map((specialty) => ({
      employeeId,
      specialty,
    })),
    skipDuplicates: true,
  })
}

async function upsertPaymentMethod(
  userId: string,
  input: {
    type: PaymentType
    provider?: string
    phone?: string
    last4?: string
    label?: string
    isDefault: boolean
  },
) {
  const existing = await prisma.paymentMethod.findFirst({
    where: {
      userId,
      type: input.type,
      provider: input.provider ?? null,
      phone: input.phone ?? null,
      last4: input.last4 ?? null,
    },
  })

  if (existing) {
    return prisma.paymentMethod.update({
      where: { id: existing.id },
      data: {
        label: input.label,
        isDefault: input.isDefault,
        isActive: true,
      },
    })
  }

  return prisma.paymentMethod.create({
    data: {
      userId,
      type: input.type,
      provider: input.provider,
      phone: input.phone,
      last4: input.last4,
      label: input.label,
      isDefault: input.isDefault,
      isActive: true,
    },
  })
}

async function cleanupDemoOperationalData(
  salonId: string,
  clientId: string,
  employeeIds: string[],
) {
  await prisma.paymentIntent.deleteMany({
    where: {
      OR: [
        { salonId },
        { userId: clientId },
      ],
    },
  })

  await prisma.employeeBlockedSlot.deleteMany({
    where: { salonId, employeeId: { in: employeeIds } },
  })

  await prisma.leaveRequest.deleteMany({
    where: { employeeId: { in: employeeIds } },
  })

  await prisma.appointment.deleteMany({
    where: {
      salonId,
      clientId,
    },
  })
}

function atUtc(anchor: Date, dayOffset: number, hour: number, minute: number) {
  const next = new Date(anchor)
  next.setUTCDate(anchor.getUTCDate() + dayOffset)
  next.setUTCHours(hour, minute, 0, 0)
  return next
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

main()
  .catch((error) => {
    console.error('Beta-ready seed failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
