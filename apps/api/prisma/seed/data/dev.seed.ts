import {
  PrismaClient,
  UserRole,
  EmployeeStatus,
  AppointmentStatus,
  AppointmentSource,
  PaymentStatus,
  PaymentType,
  ExpenseStatus,
  User,
  SalonClient,
} from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedDev(prisma: PrismaClient) {
  const password = await bcrypt.hash("password123", 10);
type SeedClient = {
  user: User;
  salonClient: SalonClient;
};
  await prisma.paymentIntent.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.salonClient.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.employeeAbsence.deleteMany();
  await prisma.employeeLeaveRequest.deleteMany();
  await prisma.employeeSchedule.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.service.deleteMany();
  await prisma.salonSchedule.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.user.deleteMany();

  const pro = await prisma.user.create({
    data: {
      email: "pro@ambya.com",
      password,
      role: UserRole.PROFESSIONAL,
      isActive: true,
    },
  });

  const salon = await prisma.salon.create({
    data: {
      name: "Ambya Beauty Salon",
      city: "Libreville",
      country: "Gabon",
      currency: "XAF",
      timezone: "Africa/Libreville",
      depositEnabled: true,
      depositPercentage: 30,
      ownerId: pro.id,
      phone: "+24177000000",
      email: "pro@ambya.com",
      address: "Libreville, Gabon",
    },
  });

  const scheduleData = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    salonId: salon.id,
    dayOfWeek,
    startTime: "09:00",
    endTime: "18:00",
    isOpen: true,
  }));

  await prisma.salonSchedule.createMany({ data: scheduleData });
  await prisma.salonSchedule.create({
    data: {
      salonId: salon.id,
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "18:00",
      isOpen: false,
    },
  });

  const employeeUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "marie.employee@ambya.com",
        password,
        role: UserRole.EMPLOYEE,
      },
    }),
    prisma.user.create({
      data: {
        email: "jean.employee@ambya.com",
        password,
        role: UserRole.EMPLOYEE,
      },
    }),
    prisma.user.create({
      data: {
        email: "sophie.employee@ambya.com",
        password,
        role: UserRole.EMPLOYEE,
      },
    }),
  ]);

  const [marie, jean, sophie] = await Promise.all([
    prisma.employee.create({
      data: {
        salonId: salon.id,
        userId: employeeUsers[0].id,
        displayName: "Marie Kouassi",
        firstName: "Marie",
        lastName: "Kouassi",
        roleLabel: "Coiffeuse",
        status: EmployeeStatus.ACTIVE,
        isActive: true,
        email: "marie.employee@ambya.com",
        phone: "+24177000001",
      },
    }),
    prisma.employee.create({
      data: {
        salonId: salon.id,
        userId: employeeUsers[1].id,
        displayName: "Jean Bongo",
        firstName: "Jean",
        lastName: "Bongo",
        roleLabel: "Barbier",
        status: EmployeeStatus.ACTIVE,
        isActive: true,
        email: "jean.employee@ambya.com",
        phone: "+24177000002",
      },
    }),
    prisma.employee.create({
      data: {
        salonId: salon.id,
        userId: employeeUsers[2].id,
        displayName: "Sophie Mbongo",
        firstName: "Sophie",
        lastName: "Mbongo",
        roleLabel: "Esthéticienne",
        status: EmployeeStatus.ABSENT,
        isActive: true,
        email: "sophie.employee@ambya.com",
        phone: "+24177000003",
      },
    }),
  ]);

  const services = await Promise.all([
    prisma.service.create({
      data: {
        salonId: salon.id,
        name: "Tresses simples",
        category: "Coiffure",
        price: 15000,
        durationMin: 90,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        name: "Coupe homme",
        category: "Barbier",
        price: 8000,
        durationMin: 30,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        name: "Massage relaxant",
        category: "Massage",
        price: 18000,
        durationMin: 60,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        name: "Manucure classique",
        category: "Ongles",
        price: 12000,
        durationMin: 45,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        name: "Brushing",
        category: "Coiffure",
        price: 10000,
        durationMin: 45,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        name: "Coloration",
        category: "Coiffure",
        price: 25000,
        durationMin: 120,
        isActive: false,
      },
    }),
  ]);

  const clients: SeedClient[] = [];
  for (let i = 1; i <= 6; i++) {
    const user = await prisma.user.create({
      data: {
        email: `client${i}@ambya.com`,
        password,
        role: UserRole.CLIENT,
        isActive: true,
      },
    });

    await prisma.clientProfile.create({
      data: {
        userId: user.id,
        nickname: `Client ${i}`,
        gender: "F",
        ageRange: "25-34",
        city: "Libreville",
        country: "Gabon",
        allergies: i === 3 ? "Produits chimiques forts" : null,
      },
    });

    const salonClient = await prisma.salonClient.create({
      data: {
        salonId: salon.id,
        clientId: user.id,
        isRegular: i === 1,
        isBlocked: i === 4,
        isDepositExempt: i === 5,
      },
    });

    clients.push({ user, salonClient });
  }

  const now = new Date();
  const addHours = (date: Date, h: number) => new Date(date.getTime() + h * 3600000);
  const addDays = (date: Date, d: number) => new Date(date.getTime() + d * 86400000);

  const appointmentsData = [
    {
      clientId: clients[0].user.id,
      salonClientId: clients[0].salonClient.id,
      serviceId: services[0].id,
      employeeId: marie.id,
      status: AppointmentStatus.PENDING,
      startAt: addHours(addDays(now, 0), 1),
      endAt: addHours(addDays(now, 0), 2.5),
      totalAmount: 15000,
    },
    {
      clientId: clients[1].user.id,
      salonClientId: clients[1].salonClient.id,
      serviceId: services[1].id,
      employeeId: jean.id,
      status: AppointmentStatus.CONFIRMED,
      startAt: addHours(addDays(now, 0), 3),
      endAt: addHours(addDays(now, 0), 3.5),
      totalAmount: 8000,
    },
    {
      clientId: clients[2].user.id,
      salonClientId: clients[2].salonClient.id,
      serviceId: services[2].id,
      employeeId: sophie.id,
      status: AppointmentStatus.COMPLETED,
      startAt: addHours(addDays(now, -2), 2),
      endAt: addHours(addDays(now, -2), 3),
      totalAmount: 18000,
    },
    {
      clientId: clients[3].user.id,
      salonClientId: clients[3].salonClient.id,
      serviceId: services[3].id,
      employeeId: marie.id,
      status: AppointmentStatus.CANCELLED,
      startAt: addHours(addDays(now, -3), 1),
      endAt: addHours(addDays(now, -3), 1.75),
      totalAmount: 12000,
    },
    {
      clientId: clients[4].user.id,
      salonClientId: clients[4].salonClient.id,
      serviceId: services[4].id,
      employeeId: marie.id,
      status: AppointmentStatus.NO_SHOW,
      startAt: addHours(addDays(now, -5), 2),
      endAt: addHours(addDays(now, -5), 2.75),
      totalAmount: 10000,
    },
    {
      clientId: clients[5].user.id,
      salonClientId: clients[5].salonClient.id,
      serviceId: services[0].id,
      employeeId: null,
      status: AppointmentStatus.PENDING,
      startAt: addHours(addDays(now, 1), 4),
      endAt: addHours(addDays(now, 1), 5.5),
      totalAmount: 15000,
    },
  ];

  for (const appt of appointmentsData) {
    const created = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        clientId: appt.clientId,
        salonClientId: appt.salonClientId,
        serviceId: appt.serviceId,
        employeeId: appt.employeeId,
        status: appt.status,
        source: AppointmentSource.PRO_DASHBOARD,
        startAt: appt.startAt,
        endAt: appt.endAt,
        subtotalAmount: appt.totalAmount,
        totalAmount: appt.totalAmount,
        remainingAmount: appt.totalAmount,
        createdById: pro.id,
      },
    });

    await prisma.paymentIntent.create({
      data: {
        userId: appt.clientId,
        salonId: salon.id,
        appointmentId: created.id,
        amount: appt.totalAmount,
        payableAmount: appt.totalAmount,
        currency: "XAF",
        type:
          appt.status === AppointmentStatus.COMPLETED
            ? PaymentType.MOMO
            : PaymentType.CASH,
        status:
          appt.status === AppointmentStatus.COMPLETED
            ? PaymentStatus.SUCCEEDED
            : appt.status === AppointmentStatus.CANCELLED
            ? PaymentStatus.CANCELLED
            : PaymentStatus.PENDING,
        provider: appt.status === AppointmentStatus.COMPLETED ? "AIRTEL_MONEY" : "CASH",
        netAmount: appt.totalAmount,
      },
    });
  }

  await prisma.expense.createMany({
    data: [
      {
        salonId: salon.id,
        category: "Produits",
        description: "Achat shampooing professionnel",
        amount: 15000,
        expenseDate: new Date(),
        status: ExpenseStatus.CONFIRMED,
        createdById: pro.id,
      },
      {
        salonId: salon.id,
        category: "Salaires",
        description: "Salaire Marie",
        amount: 120000,
        expenseDate: new Date(),
        status: ExpenseStatus.CONFIRMED,
        createdById: pro.id,
      },
      {
        salonId: salon.id,
        category: "Électricité",
        description: "Facture du mois",
        amount: 25000,
        expenseDate: new Date(),
        status: ExpenseStatus.CONFIRMED,
        createdById: pro.id,
      },
      {
        salonId: salon.id,
        category: "Marketing",
        description: "Publicité réseaux sociaux",
        amount: 8000,
        expenseDate: new Date(),
        status: ExpenseStatus.CONFIRMED,
        createdById: pro.id,
      },
    ],
  });

  await prisma.clientNote.create({
    data: {
      salonId: salon.id,
      salonClientId: clients[2].salonClient.id,
      content: "Préfère les rendez-vous le matin. Allergie aux produits chimiques forts.",
      createdById: pro.id,
      updatedById: pro.id,
    },
  });

  console.log("✅ Seed test Ambya terminé");
}