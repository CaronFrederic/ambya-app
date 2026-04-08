import {
  PrismaClient,
  User,
  SalonClient,
  UserRole,
  EmployeeStatus,
  AppointmentStatus,
  AppointmentSource,
  PaymentStatus,
  PaymentType,
  ExpenseStatus,
  ServiceStatus,
  LoyaltyTier,
}  from "src/generated/prisma";
import bcrypt from "bcrypt";
import { Prisma } from "src/generated/prisma";
export async function seedTest(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("🧹 Cleaning database...");

  await prisma.loyaltyTransaction.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.clientPreference.deleteMany();
  await prisma.salonClientPreferredEmployee.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.salonClient.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.employeeAbsence.deleteMany();
  await prisma.employeeLeaveRequest.deleteMany();
  await prisma.employeeSchedule.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.promotionService.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.service.deleteMany();
  await prisma.salonSchedule.deleteMany();
  await prisma.loyaltyConfig.deleteMany();
  await prisma.salonReview.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Creating professional user...");

  const proUser = await prisma.user.create({
    data: {
      email: "pro@ambya.com",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      isActive: true,
    },
  });

  console.log("🏪 Creating salon...");

  const salon = await prisma.salon.create({
    data: {
      name: "Ambya Beauty Salon",
      description:
        "Salon de coiffure et beauté à Libreville, spécialisé en coiffure afro, manucure et soins.",
      address: "Boulevard Triomphal, Libreville, Gabon",
      city: "Libreville",
      country: "Gabon",
      phone: "+24177000000",
      email: "contact@ambya.com",
      currency: "XAF",
      timezone: "Africa/Libreville",
      depositEnabled: true,
      depositPercentage: 30,
      instagramHandle: "@ambyasalon",
      facebookUrl: "https://facebook.com/ambyasalon",
      websiteUrl: "https://ambya.local",
      showInstagramFeed: true,
      showTikTokFeed: false,
      ownerId: proUser.id,
      isActive: true,
      paymentSettings: {
        mobileMoney: true,
        card: true,
        cash: true,
        orangeMoney: "+24177000001",
        moovMoney: "+24166000002",
        airtelMoney: "+24174000003",
        bankName: "BGFI Bank",
        iban: "GA0000000000000001",
        bankOwner: "Ambya Beauty Salon",
        cancelPolicyHours: 24,
      },
    },
  });

  console.log("🕒 Creating salon schedules...");

  const salonSchedules = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isOpen: true },
    { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isOpen: true },
    { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isOpen: true },
    { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isOpen: true },
    { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isOpen: true },
    { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isOpen: true },
    { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isOpen: false },
  ];

  await prisma.salonSchedule.createMany({
    data: salonSchedules.map((s) => ({
      salonId: salon.id,
      ...s,
    })),
  });

  console.log("⚙️ Creating loyalty config...");

  await prisma.loyaltyConfig.create({
    data: {
      salonId: salon.id,
      enabled: true,
      cardName: "Carte Fidélité Ambya",
      pointsPerVisit: 10,
      pointsPerAmount: 1,
      rewardRulesJson: {
        silverAt: 500,
        goldAt: 2000,
        platinumAt: 5000,
      },
    },
  });

  console.log("👥 Creating employee users and employees...");

  const marieUser = await prisma.user.create({
    data: {
      email: "marie.employee@ambya.com",
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      isActive: true,
    },
  });

  const jeanUser = await prisma.user.create({
    data: {
      email: "jean.employee@ambya.com",
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      isActive: true,
    },
  });

  const sophieUser = await prisma.user.create({
    data: {
      email: "sophie.employee@ambya.com",
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      isActive: true,
    },
  });

  const marie = await prisma.employee.create({
    data: {
      salonId: salon.id,
      userId: marieUser.id,
      firstName: "Marie",
      lastName: "Kouassi",
      displayName: "Marie Kouassi",
      roleLabel: "Coiffeuse",
      photoUrl: null,
      phone: "+24177000011",
      email: "marie.employee@ambya.com",
      status: EmployeeStatus.ACTIVE,
      isActive: true,
      hireDate: new Date("2025-01-10T09:00:00.000Z"),
    },
  });

  const jean = await prisma.employee.create({
    data: {
      salonId: salon.id,
      userId: jeanUser.id,
      firstName: "Jean",
      lastName: "Bongo",
      displayName: "Jean Bongo",
      roleLabel: "Barbier",
      photoUrl: null,
      phone: "+24177000012",
      email: "jean.employee@ambya.com",
      status: EmployeeStatus.ACTIVE,
      isActive: true,
      hireDate: new Date("2025-02-15T09:00:00.000Z"),
    },
  });

  const sophie = await prisma.employee.create({
    data: {
      salonId: salon.id,
      userId: sophieUser.id,
      firstName: "Sophie",
      lastName: "Mbongo",
      displayName: "Sophie Mbongo",
      roleLabel: "Esthéticienne",
      photoUrl: null,
      phone: "+24177000013",
      email: "sophie.employee@ambya.com",
      status: EmployeeStatus.LEAVE,
      isActive: true,
      hireDate: new Date("2025-03-05T09:00:00.000Z"),
    },
  });

  console.log("📆 Creating employee schedules...");

  const employeeSchedules = [marie.id, jean.id, sophie.id].flatMap((employeeId) =>
    [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      employeeId,
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
      isWorking: true,
    })),
  );

  await prisma.employeeSchedule.createMany({
    data: employeeSchedules,
  });

  console.log("💇 Creating services...");

  const tresses = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: "Tresses simples",
      description: "Tresses classiques avec finition soignée.",
      category: "Coiffure",
      price: 15000,
      durationMin: 90,
      isActive: true,
      status: ServiceStatus.ACTIVE,
    },
  });

  const coupeHomme = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: "Coupe homme",
      description: "Coupe nette avec contours.",
      category: "Barbier",
      price: 8000,
      durationMin: 30,
      isActive: true,
      status: ServiceStatus.ACTIVE,
    },
  });

  const massage = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: "Massage relaxant",
      description: "Massage détente corps complet.",
      category: "Massage",
      price: 18000,
      durationMin: 60,
      isActive: true,
      status: ServiceStatus.ACTIVE,
    },
  });

  const manucure = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: "Manucure classique",
      description: "Soin classique des mains.",
      category: "Manucure",
      price: 12000,
      durationMin: 45,
      isActive: true,
      status: ServiceStatus.ACTIVE,
    },
  });

  const brushing = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: "Brushing",
      description: "Brushing avec finition lisse.",
      category: "Coiffure",
      price: 10000,
      durationMin: 45,
      isActive: true,
      status: ServiceStatus.ACTIVE,
    },
  });

  const coloration = await prisma.service.create({
    data: {
      salonId: salon.id,
      name: "Coloration",
      description: "Coloration complète.",
      category: "Coiffure",
      price: 25000,
      durationMin: 120,
      isActive: false,
      status: ServiceStatus.INACTIVE,
    },
  });

  console.log("🧍 Creating clients...");

  const clientUsers: User[] = [];
  const salonClients: SalonClient[] = [];

  for (let i = 1; i <= 6; i++) {
    const user = await prisma.user.create({
      data: {
        email: `client${i}@ambya.com`,
        password: hashedPassword,
        role: UserRole.CLIENT,
        isActive: true,
      },
    });

    await prisma.clientProfile.create({
      data: {
        userId: user.id,
        nickname: `Client ${i}`,
        gender: i % 2 === 0 ? "Homme" : "Femme",
        ageRange: "25-34",
        city: "Libreville",
        country: "Gabon",
        allergies: i === 3 ? "Produits chimiques forts" : null,
        comments: i === 3 ? "Privilégier les produits naturels." : null,
        questionnaire: {
          preferredSchedule: i === 1 ? "morning" : "afternoon",
          beautyHabits: "regular",
        },
      },
    });

    const salonClient = await prisma.salonClient.create({
      data: {
        salonId: salon.id,
        clientId: user.id,
        isRegular: i === 1 || i === 2,
        isBlocked: i === 4,
        isDepositExempt: i === 5,
        loyaltyPoints: i === 1 ? 280 : 0,
        firstVisitAt: new Date(`2025-10-${10 + i}T09:00:00.000Z`),
        lastVisitAt: new Date(`2026-03-${10 + i}T12:00:00.000Z`),
        totalSpent: i === 1 ? 85000 : i === 2 ? 40000 : 0,
        bookingCount: i === 1 ? 4 : i === 2 ? 2 : 0,
        completedCount: i === 1 ? 3 : i === 2 ? 2 : 0,
        canceledCount: i === 4 ? 1 : 0,
        noShowCount: i === 6 ? 1 : 0,
      },
    });

    clientUsers.push(user);
    salonClients.push(salonClient);
  }

  console.log("⭐ Creating client notes and preferences...");

  await prisma.clientNote.create({
    data: {
      salonId: salon.id,
      salonClientId: salonClients[0].id,
      content: "Préfère les rendez-vous le matin. Très ponctuelle.",
      createdById: proUser.id,
      updatedById: proUser.id,
    },
  });

  await prisma.clientNote.create({
    data: {
      salonId: salon.id,
      salonClientId: salonClients[2].id,
      content: "Allergie aux produits chimiques forts. Privilégier les soins naturels.",
      createdById: proUser.id,
      updatedById: proUser.id,
    },
  });

  await prisma.clientPreference.create({
    data: {
      salonClientId: salonClients[0].id,
      type: "SERVICE",
      value: "Tresses simples",
      serviceId: tresses.id,
    },
  });

  await prisma.clientPreference.create({
    data: {
      salonClientId: salonClients[0].id,
      type: "EMPLOYEE",
      value: "Marie Kouassi",
      employeeId: marie.id,
    },
  });

  await prisma.salonClientPreferredEmployee.create({
    data: {
      salonClientId: salonClients[0].id,
      employeeId: marie.id,
      count: 3,
    },
  });

  await prisma.salonClientPreferredEmployee.create({
    data: {
      salonClientId: salonClients[1].id,
      employeeId: jean.id,
      count: 2,
    },
  });

  console.log("🎁 Creating loyalty accounts...");

  await prisma.loyaltyAccount.create({
    data: {
      userId: clientUsers[0].id,
      tier: LoyaltyTier.BRONZE,
      currentPoints: 280,
      lifetimePoints: 280,
      pendingDiscountAmount: 0,
    },
  });

  await prisma.loyaltyAccount.create({
    data: {
      userId: clientUsers[1].id,
      tier: LoyaltyTier.SILVER,
      currentPoints: 620,
      lifetimePoints: 620,
      pendingDiscountAmount: 1000,
      pendingDiscountTier: LoyaltyTier.SILVER,
      pendingDiscountIssuedAt: new Date(),
    },
  });

  const now = new Date();
  const at = (base: Date, days: number, hour: number, minute = 0) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + days);
    d.setUTCHours(hour, minute, 0, 0);
    return d;
  };

  console.log("📅 Creating appointments...");

  const appointments = [
    {
      clientIndex: 0,
      salonClientIndex: 0,
      service: tresses,
      employeeId: marie.id,
      status: AppointmentStatus.PENDING,
      startAt: at(now, 0, 9, 0),
      endAt: at(now, 0, 10, 30),
      totalAmount: 15000,
      source: AppointmentSource.CLIENT_APP,
      note: "Cliente régulière",
      paymentType: PaymentType.MOMO,
      paymentStatus: PaymentStatus.PENDING,
      provider: "AIRTEL_MONEY",
    },
    {
      clientIndex: 1,
      salonClientIndex: 1,
      service: coupeHomme,
      employeeId: jean.id,
      status: AppointmentStatus.CONFIRMED,
      startAt: at(now, 0, 11, 0),
      endAt: at(now, 0, 11, 30),
      totalAmount: 8000,
      source: AppointmentSource.CLIENT_APP,
      note: null,
      paymentType: PaymentType.CASH,
      paymentStatus: PaymentStatus.SUCCEEDED,
      provider: "CASH",
    },
    {
      clientIndex: 2,
      salonClientIndex: 2,
      service: massage,
      employeeId: sophie.id,
      status: AppointmentStatus.COMPLETED,
      startAt: at(now, -2, 14, 0),
      endAt: at(now, -2, 15, 0),
      totalAmount: 18000,
      source: AppointmentSource.PRO_DASHBOARD,
      note: "Soin détente",
      paymentType: PaymentType.CARD,
      paymentStatus: PaymentStatus.SUCCEEDED,
      provider: "CARD",
    },
    {
      clientIndex: 3,
      salonClientIndex: 3,
      service: manucure,
      employeeId: marie.id,
      status: AppointmentStatus.CANCELLED,
      startAt: at(now, -4, 10, 0),
      endAt: at(now, -4, 10, 45),
      totalAmount: 12000,
      source: AppointmentSource.CLIENT_APP,
      note: "Annulé par cliente",
      paymentType: PaymentType.MOMO,
      paymentStatus: PaymentStatus.CANCELLED,
      provider: "ORANGE_MONEY",
    },
    {
      clientIndex: 4,
      salonClientIndex: 4,
      service: brushing,
      employeeId: marie.id,
      status: AppointmentStatus.NO_SHOW,
      startAt: at(now, -6, 13, 0),
      endAt: at(now, -6, 13, 45),
      totalAmount: 10000,
      source: AppointmentSource.CLIENT_APP,
      note: "No-show",
      paymentType: PaymentType.CASH,
      paymentStatus: PaymentStatus.PENDING,
      provider: "CASH",
    },
    {
      clientIndex: 5,
      salonClientIndex: 5,
      service: tresses,
      employeeId: null,
      status: AppointmentStatus.PENDING,
      startAt: at(now, 1, 15, 0),
      endAt: at(now, 1, 16, 30),
      totalAmount: 15000,
      source: AppointmentSource.PRO_DASHBOARD,
      note: "Sans employé assigné",
      paymentType: PaymentType.MOMO,
      paymentStatus: PaymentStatus.CREATED,
      provider: "MTN_MOMO",
    },
    {
      clientIndex: 0,
      salonClientIndex: 0,
      service: brushing,
      employeeId: marie.id,
      status: AppointmentStatus.COMPLETED,
      startAt: at(now, -10, 9, 0),
      endAt: at(now, -10, 9, 45),
      totalAmount: 10000,
      source: AppointmentSource.CLIENT_APP,
      note: null,
      paymentType: PaymentType.MOMO,
      paymentStatus: PaymentStatus.REFUNDED,
      provider: "AIRTEL_MONEY",
    },
    {
      clientIndex: 1,
      salonClientIndex: 1,
      service: coupeHomme,
      employeeId: jean.id,
      status: AppointmentStatus.COMPLETED,
      startAt: at(now, -12, 16, 0),
      endAt: at(now, -12, 16, 30),
      totalAmount: 8000,
      source: AppointmentSource.CLIENT_APP,
      note: null,
      paymentType: PaymentType.CASH,
      paymentStatus: PaymentStatus.SUCCEEDED,
      provider: "CASH",
    },
    {
      clientIndex: 2,
      salonClientIndex: 2,
      service: manucure,
      employeeId: sophie.id,
      status: AppointmentStatus.CONFIRMED,
      startAt: at(now, 2, 10, 0),
      endAt: at(now, 2, 10, 45),
      totalAmount: 12000,
      source: AppointmentSource.CLIENT_APP,
      note: null,
      paymentType: PaymentType.CARD,
      paymentStatus: PaymentStatus.PENDING,
      provider: "CARD",
    },
  ];

  for (const item of appointments) {
    const appointment = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        clientId: clientUsers[item.clientIndex].id,
        salonClientId: salonClients[item.salonClientIndex].id,
        serviceId: item.service.id,
        employeeId: item.employeeId,
        status: item.status,
        source: item.source,
        startAt: item.startAt,
        endAt: item.endAt,
        note: item.note,
        subtotalAmount: item.totalAmount,
        discountAmount: 0,
        totalAmount: item.totalAmount,
        depositAmount: salon.depositEnabled ? Math.round(item.totalAmount * 0.3) : 0,
        remainingAmount: salon.depositEnabled
          ? item.totalAmount - Math.round(item.totalAmount * 0.3)
          : item.totalAmount,
        createdById: proUser.id,
      },
    });

    await prisma.appointmentService.create({
      data: {
        appointmentId: appointment.id,
        serviceId: item.service.id,
        employeeId: item.employeeId,
        serviceNameSnapshot: item.service.name,
        durationMinSnapshot: item.service.durationMin,
        priceSnapshot: item.service.price,
      },
    });

    await prisma.paymentIntent.create({
      data: {
        userId: clientUsers[item.clientIndex].id,
        salonId: salon.id,
        appointmentId: appointment.id,
        amount: item.totalAmount,
        discountAmount: 0,
        payableAmount: item.totalAmount,
        appliedDiscountTier: null,
        currency: "XAF",
        type: item.paymentType,
        transactionDate: item.startAt,
        status: item.paymentStatus,
        provider: item.provider,
        providerRef: null,
        providerData: Prisma.JsonNull,
        platformFeeAmount: Math.floor(item.totalAmount * 0.1),
        providerFeeAmount: 0,
        netAmount: item.totalAmount - Math.floor(item.totalAmount * 0.1),
      },
    });
  }

  console.log("💸 Creating expenses...");

  await prisma.expense.createMany({
    data: [
      {
        salonId: salon.id,
        category: "Produits",
        description: "Achat shampooing professionnel",
        amount: 15000,
        expenseDate: at(now, -5, 8),
        receiptUrl: null,
        status: ExpenseStatus.CONFIRMED,
        createdById: proUser.id,
      },
      {
        salonId: salon.id,
        category: "Salaires",
        description: "Salaire Marie - Mars",
        amount: 120000,
        expenseDate: at(now, -3, 8),
        receiptUrl: null,
        status: ExpenseStatus.CONFIRMED,
        createdById: proUser.id,
      },
      {
        salonId: salon.id,
        category: "Électricité",
        description: "Facture SEEG",
        amount: 25000,
        expenseDate: at(now, -2, 8),
        receiptUrl: null,
        status: ExpenseStatus.CONFIRMED,
        createdById: proUser.id,
      },
      {
        salonId: salon.id,
        category: "Marketing",
        description: "Publicité Facebook",
        amount: 8000,
        expenseDate: at(now, -1, 8),
        receiptUrl: null,
        status: ExpenseStatus.CONFIRMED,
        createdById: proUser.id,
      },
    ],
  });

  console.log("🎯 Creating promotion...");

  const promo = await prisma.promotion.create({
    data: {
      salonId: salon.id,
      title: "Promo coiffure semaine",
      description: "Réduction spéciale sur le brushing",
      type: "PERCENTAGE",
      value: 10,
      startDate: at(now, -1, 0),
      endDate: at(now, 7, 23),
      isActive: true,
      appliesToAllServices: false,
    },
  });

  await prisma.promotionService.create({
    data: {
      promotionId: promo.id,
      serviceId: brushing.id,
    },
  });

  console.log("✅ Test seed completed successfully");
}