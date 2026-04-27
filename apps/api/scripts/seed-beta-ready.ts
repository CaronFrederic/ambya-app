import 'dotenv/config'
import {
  AdminScope,
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

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin.beta@ambya.com' },
    update: {
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      phone: '+24170000099',
    },
    create: {
      email: 'admin.beta@ambya.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      phone: '+24170000099',
    },
  })

  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: {
      firstName: 'Amina',
      lastName: 'Admin',
      scope: AdminScope.SUPER_ADMIN,
      notes: 'Compte de demonstration back-office',
    },
    create: {
      userId: adminUser.id,
      firstName: 'Amina',
      lastName: 'Admin',
      scope: AdminScope.SUPER_ADMIN,
      notes: 'Compte de demonstration back-office',
    },
  })

  const salon = await ensureSalon(professional.id)
  await ensureDiscoverySalons(professional.id)
  await spreadExistingSalonCoordinates()

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
  console.log('Admin: admin.beta@ambya.com / password123')
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

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminScope') THEN
        CREATE TYPE "AdminScope" AS ENUM ('SUPER_ADMIN', 'SUPPORT', 'OPS');
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
    CREATE TABLE IF NOT EXISTS "AdminProfile" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "firstName" TEXT,
      "lastName" TEXT,
      "scope" "AdminScope" NOT NULL DEFAULT 'SUPPORT',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_userId_key"
      ON "AdminProfile"("userId");
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL,
      "actionType" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT,
      "actorUserId" TEXT,
      "actorRole" "UserRole",
      "actorAdminScope" "AdminScope",
      "requestId" TEXT,
      "route" TEXT,
      "method" TEXT,
      "oldValue" JSONB,
      "newValue" JSONB,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx"
      ON "AuditLog"("createdAt");
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
        openingHoursJson: buildDefaultOpeningHours(),
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
      openingHoursJson: buildDefaultOpeningHours(),
    },
  })
}

function buildDefaultOpeningHours() {
  return [
    { day: 'Lundi', open: '09:00', close: '19:00', closed: false },
    { day: 'Mardi', open: '09:00', close: '19:00', closed: false },
    { day: 'Mercredi', open: '09:00', close: '19:00', closed: false },
    { day: 'Jeudi', open: '09:00', close: '19:00', closed: false },
    { day: 'Vendredi', open: '09:00', close: '19:00', closed: false },
    { day: 'Samedi', open: '09:00', close: '18:00', closed: false },
    { day: 'Dimanche', open: null, close: null, closed: true },
  ]
}

async function ensureDiscoverySalons(ownerId: string) {
  const demoSalons = [
    {
      name: 'Salon Élégance',
      description: 'Adresse prisée pour coiffure premium et mises en beauté.',
      address: '12 rue Charbonnages, quartier Charbonnages',
      city: 'Libreville',
      country: 'Gabon',
      phone: '+24170000110',
      coverImageUrl:
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Beauty Lounge Glass',
      description: 'Salon urbain moderne au coeur du quartier Glass.',
      address: 'Avenue de Cointet, quartier Glass',
      city: 'Libreville',
      country: 'Gabon',
      phone: '+24170000111',
      coverImageUrl:
        'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Maison Akanda Spa',
      description: 'Espace bien-être et soins dans la zone résidentielle d’Akanda.',
      address: 'Route du Cap Esterias, quartier Akanda',
      city: 'Libreville',
      country: 'Gabon',
      phone: '+24170000112',
      coverImageUrl:
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Studio Nzeng Signature',
      description: 'Coiffure, barbe et rituels express au coeur de Nzeng-Ayong.',
      address: 'Boulevard de Nzeng-Ayong, quartier Nzeng-Ayong',
      city: 'Libreville',
      country: 'Gabon',
      phone: '+24170000113',
      coverImageUrl:
        'https://images.unsplash.com/photo-1519415943484-f6b3433f9b73?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Belleza Beauty',
      description: 'Salon chaleureux près du centre de Lambaréné.',
      address: 'Rue de l’Ogooué, quartier Centre-Ville',
      city: 'Lambaréné',
      country: 'Gabon',
      phone: '+24170000120',
      coverImageUrl:
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Prestige Beauty',
      description: 'Adresse cocooning pour soins visage et massages à Lambaréné.',
      address: 'Avenue du Gouverneur, quartier Isaac',
      city: 'Lambaréné',
      country: 'Gabon',
      phone: '+24170000121',
      coverImageUrl:
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Aura Beauty Port-Gentil',
      description: 'Salon lumineux pour coiffure et manucure à Port-Gentil.',
      address: 'Boulevard Léon Mba, quartier Centre',
      city: 'Port-Gentil',
      country: 'Gabon',
      phone: '+24170000130',
      coverImageUrl:
        'https://images.unsplash.com/photo-1595475884562-073c30d45670?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Velvet Beauty Marina',
      description: 'Expérience premium à deux pas de la marina de Port-Gentil.',
      address: 'Rue des Pétroliers, quartier Bord de Mer',
      city: 'Port-Gentil',
      country: 'Gabon',
      phone: '+24170000131',
      coverImageUrl:
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Éden Beauté Franceville',
      description: 'Institut élégant pour détente et remise en forme à Franceville.',
      address: 'Avenue Savorgnan, quartier Potos',
      city: 'Franceville',
      country: 'Gabon',
      phone: '+24170000140',
      coverImageUrl:
        'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80',
    },
  ] as const

  for (const definition of demoSalons) {
    const existing = await prisma.salon.findFirst({
      where: { ownerId, name: definition.name },
      select: { id: true },
    })

    const salon = existing
      ? await prisma.salon.update({
          where: { id: existing.id },
          data: {
            description: definition.description,
            address: definition.address,
            city: definition.city,
            country: definition.country,
            phone: definition.phone,
            isActive: true,
            coverImageUrl: definition.coverImageUrl,
            galleryImageUrls: [
              definition.coverImageUrl,
              'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80',
            ],
            socialLinks: {
              instagram: 'https://instagram.com/ambya.demo',
              facebook: 'https://facebook.com/ambya.demo',
            },
            openingHoursJson: buildDefaultOpeningHours(),
          },
        })
      : await prisma.salon.create({
          data: {
            ownerId,
            name: definition.name,
            description: definition.description,
            address: definition.address,
            city: definition.city,
            country: definition.country,
            phone: definition.phone,
            isActive: true,
            coverImageUrl: definition.coverImageUrl,
            galleryImageUrls: [
              definition.coverImageUrl,
              'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80',
            ],
            socialLinks: {
              instagram: 'https://instagram.com/ambya.demo',
              facebook: 'https://facebook.com/ambya.demo',
            },
           openingHours: {
  create: buildDefaultOpeningHours().map((item, index) => ({
    dayOfWeek: index + 1,
    isOpen: !item.closed,
    startTime: item.open ?? '08:00',
    endTime: item.close ?? '18:00',
  })),
},
          },
        })

    await ensureServices(salon.id)
  }
}

type SeedCoordinates = {
  latitude: number
  longitude: number
}

const CITY_COORDINATE_CENTERS: Record<string, SeedCoordinates> = {
  libreville: { latitude: 0.4162, longitude: 9.4673 },
  'port-gentil': { latitude: -0.7193, longitude: 8.7815 },
  franceville: { latitude: -1.6333, longitude: 13.5836 },
  oyem: { latitude: 1.5995, longitude: 11.5793 },
  lambarene: { latitude: -0.7000, longitude: 10.2400 },
  mouila: { latitude: -1.8670, longitude: 11.0559 },
}

const QUARTER_HINT_OFFSETS: Array<{ hint: string; latitude: number; longitude: number }> = [
  { hint: 'batterie', latitude: 0.0065, longitude: 0.0042 },
  { hint: 'charbonnages', latitude: 0.0042, longitude: 0.0028 },
  { hint: 'glass', latitude: 0.0031, longitude: -0.0025 },
  { hint: 'louis', latitude: -0.0024, longitude: 0.0032 },
  { hint: 'angondje', latitude: 0.0135, longitude: 0.0098 },
  { hint: 'akanda', latitude: 0.0102, longitude: 0.0074 },
  { hint: 'nzeng', latitude: -0.0062, longitude: -0.0048 },
  { hint: 'pk', latitude: -0.0084, longitude: -0.0063 },
  { hint: 'centre', latitude: 0.0012, longitude: 0.0015 },
]

async function spreadExistingSalonCoordinates() {
  const salons = await prisma.salon.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
    },
    orderBy: [{ city: 'asc' }, { name: 'asc' }],
  })

  for (let index = 0; index < salons.length; index += 1) {
    const salon = salons[index]
    const coordinates = buildSeedCoordinatesForSalon(salon, index)
    await prisma.salon.update({
      where: { id: salon.id },
      data: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
    })
  }
}

function buildSeedCoordinatesForSalon(
  salon: {
    id: string
    name: string
    address: string | null
    city: string | null
    country: string | null
  },
  index: number,
) {
  const cityKey = normalizeSeedText(salon.city)
  const center = CITY_COORDINATE_CENTERS[cityKey] ?? CITY_COORDINATE_CENTERS.libreville
  const base = {
    latitude: center.latitude,
    longitude: center.longitude,
  }

  const quarterOffset = findQuarterHintOffset(salon.address, salon.name)
  if (quarterOffset) {
    base.latitude += quarterOffset.latitude
    base.longitude += quarterOffset.longitude
  }

  const stableOffset = buildStableScatterOffset(
    `${salon.id}-${salon.city ?? ''}-${salon.address ?? salon.name}`,
    index,
  )

  return {
    latitude: roundCoordinate(base.latitude + stableOffset.latitude),
    longitude: roundCoordinate(base.longitude + stableOffset.longitude),
  }
}

function findQuarterHintOffset(...values: Array<string | null | undefined>) {
  const haystack = normalizeSeedText(values.filter(Boolean).join(' '))
  return QUARTER_HINT_OFFSETS.find((item) => haystack.includes(item.hint)) ?? null
}

function buildStableScatterOffset(seed: string, index: number) {
  const hash = Array.from(seed).reduce((acc, char, charIndex) => {
    return (acc + char.charCodeAt(0) * (charIndex + 1)) % 100000
  }, 0)

  const ring = (hash % 5) + 1
  const angle = ((hash + index * 37) % 360) * (Math.PI / 180)
  const radius = 0.0012 * ring

  return {
    latitude: Math.sin(angle) * radius,
    longitude: Math.cos(angle) * radius,
  }
}

function normalizeSeedText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(6))
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
