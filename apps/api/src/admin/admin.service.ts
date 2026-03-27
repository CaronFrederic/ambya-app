import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AdminScope, AppointmentStatus, EmployeeSpecialty, PaymentStatus, Prisma, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { AuditService } from '../audit/audit.service'
import {
  getEmployeeSpecialtyLabels,
  getPrimaryEmployeeSpecialtyLabel,
} from '../common/employee-specialties'
import { CreateAdminDto } from './dto/create-admin.dto'
import { UpdateAdminDto } from './dto/update-admin.dto'
import { ListUsersQueryDto } from './dto/list-users-query.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ListSalonsQueryDto } from './dto/list-salons-query.dto'
import { UpdateSalonDto } from './dto/update-salon.dto'
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto'
import { UpdateAppointmentDto } from './dto/update-appointment.dto'
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto'

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getDashboard(user: JwtUser) {
    await this.assertAdmin(user)

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(todayStart)
    weekStart.setDate(todayStart.getDate() - ((todayStart.getDay() + 6) % 7))
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [users, salons, appointments, paymentIntents, loyaltyAccounts, recentAppointments, recentLogs, pendingLeaveRequests] =
      await Promise.all([
        this.prisma.user.findMany({
          select: { id: true, role: true, isActive: true, createdAt: true },
        }),
        this.prisma.salon.findMany({
          select: { id: true, name: true, isActive: true },
        }),
        this.prisma.appointment.findMany({
          include: {
            salon: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
            employee: { select: { id: true, displayName: true } },
          },
        }),
        this.prisma.paymentIntent.findMany({
          include: {
            salon: { select: { id: true, name: true } },
            appointment: {
              select: {
                id: true,
                service: { select: { id: true, name: true } },
                employee: { select: { id: true, displayName: true } },
              },
            },
          },
        }),
        this.prisma.loyaltyAccount.findMany({
          select: { id: true, tier: true, currentPoints: true },
        }),
        this.prisma.appointment.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            salon: { select: { name: true } },
            service: { select: { name: true } },
            client: {
              select: {
                email: true,
                phone: true,
                clientProfile: { select: { nickname: true } },
              },
            },
          },
        }),
        this.prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.leaveRequest.count({
          where: { status: 'PENDING' },
        }),
      ])

    const roleCounts = users.reduce<Record<string, number>>((acc, item) => {
      acc[item.role] = (acc[item.role] ?? 0) + 1
      return acc
    }, {})

    const activeClients = new Set(
      appointments
        .filter((item) => item.startAt >= thirtyDaysAgo)
        .map((item) => item.clientId),
    )

    const recurrentClients = new Set<string>()
    const appointmentsByClient = appointments.reduce<Record<string, number>>((acc, item) => {
      acc[item.clientId] = (acc[item.clientId] ?? 0) + 1
      if (acc[item.clientId] >= 2) {
        recurrentClients.add(item.clientId)
      }
      return acc
    }, {})
    void appointmentsByClient

    const appointmentStatusCounts = appointments.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1
      return acc
    }, {})

    const successfulPayments = paymentIntents.filter((item) => item.status === PaymentStatus.SUCCEEDED)
    const totalRevenueTreated = paymentIntents.reduce(
      (sum, item) => sum + (item.payableAmount || item.amount || 0),
      0,
    )
    const cashflowGlobal = successfulPayments.reduce(
      (sum, item) => sum + (item.payableAmount || item.amount || 0),
      0,
    )
    const ambyaRevenue = successfulPayments.reduce(
      (sum, item) => sum + (item.platformFeeAmount || 0),
      0,
    )
    const volumeTotalEncaisse = successfulPayments.reduce(
      (sum, item) => sum + (item.netAmount || item.payableAmount || item.amount || 0),
      0,
    )

    const transactionsByStatus = paymentIntents.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1
      return acc
    }, {})
    const transactionsByProvider = paymentIntents.reduce<Record<string, number>>((acc, item) => {
      const key = item.provider || 'UNSPECIFIED'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    const revenueBySalon = this.sumByLabel(
      successfulPayments.map((item) => ({
        label: item.salon?.name ?? 'Salon inconnu',
        value: item.payableAmount || item.amount || 0,
      })),
    )

    const topServicesByRevenue = this.sumByLabel(
      successfulPayments
        .filter((item) => item.appointment?.service?.name)
        .map((item) => ({
          label: item.appointment?.service?.name ?? 'Service inconnu',
          value: item.payableAmount || item.amount || 0,
        })),
    )

    const appointmentsBySalon = this.countByLabel(
      appointments.map((item) => item.salon.name),
    )
    const appointmentsByEmployee = this.countByLabel(
      appointments.map((item) => item.employee?.displayName ?? 'Non assigne'),
    )
    const appointmentsByService = this.countByLabel(
      appointments.map((item) => item.service.name),
    )

    const supportAlerts = [
      {
        label: 'Paiements problematiques',
        count: paymentIntents.filter(
          (item) =>
            item.status === PaymentStatus.FAILED ||
            (item.status === PaymentStatus.PENDING && item.createdAt < yesterday),
        ).length,
      },
      {
        label: 'Conges en attente',
        count: pendingLeaveRequests,
      },
      {
        label: 'Salons inactifs',
        count: salons.filter((item) => !item.isActive).length,
      },
      {
        label: 'RDV a confirmer',
        count: appointmentStatusCounts.PENDING ?? 0,
      },
    ]

    return {
      overview: {
        totalClients: roleCounts.CLIENT ?? 0,
        totalProfessionals: roleCounts.PROFESSIONAL ?? 0,
        totalEmployees: roleCounts.EMPLOYEE ?? 0,
        totalAdmins: roleCounts.ADMIN ?? 0,
        totalSalons: salons.length,
        activeSalons: salons.filter((item) => item.isActive).length,
        inactiveSalons: salons.filter((item) => !item.isActive).length,
        newUsers7d: users.filter((item) => item.createdAt >= sevenDaysAgo).length,
        newUsers30d: users.filter((item) => item.createdAt >= thirtyDaysAgo).length,
        activeClients30d: activeClients.size,
        recurrentClients: recurrentClients.size,
      },
      finance: {
        cashflowGlobal,
        totalRevenueTreated,
        ambyaRevenue,
        ambyaRevenueSharePct: cashflowGlobal > 0 ? Math.round((ambyaRevenue / cashflowGlobal) * 1000) / 10 : 0,
        volumeTotalEncaisse,
        averageBasket: successfulPayments.length > 0 ? Math.round(cashflowGlobal / successfulPayments.length) : 0,
        revenueToday: this.sumPaymentsFrom(successfulPayments, todayStart),
        revenueWeek: this.sumPaymentsFrom(successfulPayments, weekStart),
        revenueMonth: this.sumPaymentsFrom(successfulPayments, monthStart),
        revenueBySalon,
        topSalonsByRevenue: revenueBySalon.slice(0, 5),
        topServicesByRevenue: topServicesByRevenue.slice(0, 5),
      },
      appointments: {
        total: appointments.length,
        today: appointments.filter((item) => item.startAt >= todayStart).length,
        week: appointments.filter((item) => item.startAt >= weekStart).length,
        month: appointments.filter((item) => item.startAt >= monthStart).length,
        byStatus: appointmentStatusCounts,
        confirmationRate: this.rateOf(
          (appointmentStatusCounts.CONFIRMED ?? 0) + (appointmentStatusCounts.COMPLETED ?? 0),
          appointments.length,
        ),
        cancellationRate: this.rateOf(
          (appointmentStatusCounts.CANCELLED ?? 0) + (appointmentStatusCounts.REJECTED ?? 0),
          appointments.length,
        ),
        noShowRate: this.rateOf(appointmentStatusCounts.NO_SHOW ?? 0, appointments.length),
        completionRate: this.rateOf(appointmentStatusCounts.COMPLETED ?? 0, appointments.length),
        bySalon: appointmentsBySalon.slice(0, 8),
        byEmployee: appointmentsByEmployee.slice(0, 8),
        byService: appointmentsByService.slice(0, 8),
      },
      payments: {
        totalTransactions: paymentIntents.length,
        successful: transactionsByStatus.SUCCEEDED ?? 0,
        failed: transactionsByStatus.FAILED ?? 0,
        pending: (transactionsByStatus.CREATED ?? 0) + (transactionsByStatus.PENDING ?? 0),
        refunded: transactionsByStatus.REFUNDED ?? 0,
        successRate: this.rateOf(transactionsByStatus.SUCCEEDED ?? 0, paymentIntents.length),
        byStatus: transactionsByStatus,
        byProvider: Object.entries(transactionsByProvider)
          .map(([label, value]) => ({ label, value }))
          .sort((left, right) => right.value - left.value),
        problematicTransactions: supportAlerts.find((item) => item.label === 'Paiements problematiques')?.count ?? 0,
      },
      loyalty: {
        activeAccounts: loyaltyAccounts.filter((item) => item.currentPoints > 0).length,
        byTier: this.countByLabel(loyaltyAccounts.map((item) => item.tier)),
      },
      support: {
        alerts: supportAlerts,
        recentLogs: recentLogs.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      },
      recentAppointments: recentAppointments.map((item) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        salonName: item.salon.name,
        serviceName: item.service.name,
        clientName: this.getClientDisplayName(item.client),
      })),
    }
  }

  async listAdmins(user: JwtUser) {
    await this.assertAdmin(user)
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      include: { adminProfile: true },
      orderBy: { createdAt: 'desc' },
    })

    return { items: admins.map((item) => this.mapAdmin(item)), total: admins.length }
  }

  async createAdmin(user: JwtUser, dto: CreateAdminDto) {
    await this.assertAdmin(user, [AdminScope.SUPER_ADMIN])
    const email = dto.email.trim().toLowerCase()
    const phone = dto.phone?.trim() || null
    await this.ensureUniqueUserFields({ email, phone })

    const created = await this.prisma.user.create({
      data: {
        email,
        phone: phone ?? undefined,
        password: await bcrypt.hash(dto.password, 10),
        role: UserRole.ADMIN,
        isActive: true,
        adminProfile: {
          create: {
            firstName: dto.firstName?.trim(),
            lastName: dto.lastName?.trim(),
            scope: dto.scope ?? AdminScope.SUPPORT,
            notes: dto.notes?.trim(),
          },
        },
      },
      include: { adminProfile: true },
    })

    await this.audit.logCrudMutation({
      action: 'create',
      entityType: 'admin',
      entityId: created.id,
      newValue: this.mapAdmin(created),
    })

    return { item: this.mapAdmin(created) }
  }

  async getAdmin(user: JwtUser, adminId: string) {
    await this.assertAdmin(user)
    const admin = await this.findAdminOrThrow(adminId)
    return { item: this.mapAdmin(admin) }
  }

  async updateAdmin(user: JwtUser, adminId: string, dto: UpdateAdminDto) {
    await this.assertAdmin(user, [AdminScope.SUPER_ADMIN])
    const admin = await this.findAdminOrThrow(adminId)
    const previous = this.mapAdmin(admin)

    await this.ensureUniqueUserFields(
      {
        email: dto.email?.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
      },
      admin.id,
    )

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: admin.id },
        data: {
          email: dto.email?.trim().toLowerCase() ?? undefined,
          phone: dto.phone?.trim() || undefined,
          isActive: dto.isActive ?? undefined,
        },
      })

      await tx.adminProfile.upsert({
        where: { userId: admin.id },
        update: {
          firstName: dto.firstName ?? undefined,
          lastName: dto.lastName ?? undefined,
          scope: dto.scope ?? undefined,
          notes: dto.notes ?? undefined,
        },
        create: {
          userId: admin.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          scope: dto.scope ?? AdminScope.SUPPORT,
          notes: dto.notes,
        },
      })
    })

    const refreshed = await this.findAdminOrThrow(admin.id)
    await this.audit.logCrudMutation({
      action: 'update',
      entityType: 'admin',
      entityId: admin.id,
      oldValue: previous,
      newValue: this.mapAdmin(refreshed),
    })

    return { item: this.mapAdmin(refreshed) }
  }

  async listUsers(user: JwtUser, query: ListUsersQueryDto) {
    await this.assertAdmin(user)
    const q = query.q?.trim()
    const users = await this.prisma.user.findMany({
      where: {
        role: query.role ?? { not: UserRole.ADMIN },
        ...(query.isActive ? { isActive: query.isActive === 'true' } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { clientProfile: { nickname: { contains: q, mode: 'insensitive' } } },
                { employeeProfile: { displayName: { contains: q, mode: 'insensitive' } } },
                { ownedSalons: { some: { name: { contains: q, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: {
        clientProfile: { select: { nickname: true, city: true, country: true } },
        employeeProfile: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            salon: { select: { id: true, name: true } },
          },
        },
        ownedSalons: { select: { id: true, name: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { items: users.map((item) => this.mapUser(item)), total: users.length }
  }

  async getUser(user: JwtUser, userId: string) {
    await this.assertAdmin(user)
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        employeeProfile: {
          include: {
            salon: { select: { id: true, name: true } },
            specialties: { select: { specialty: true } },
            appointments: {
              orderBy: { startAt: 'desc' },
              take: 12,
              include: {
                salon: { select: { id: true, name: true } },
                service: { select: { id: true, name: true, category: true, price: true } },
                client: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                    clientProfile: { select: { nickname: true } },
                  },
                },
                paymentIntents: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { id: true, status: true, payableAmount: true, amount: true, currency: true },
                },
              },
            },
          },
        },
        ownedSalons: { select: { id: true, name: true } },
        paymentMethods: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        loyaltyAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 12,
            },
          },
        },
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 20,
          include: {
            client: {
              select: {
                id: true,
                email: true,
                phone: true,
                clientProfile: { select: { nickname: true } },
              },
            },
            salon: { select: { id: true, name: true } },
            service: { select: { id: true, name: true, category: true, price: true } },
            employee: { select: { id: true, displayName: true } },
            paymentIntents: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, status: true, payableAmount: true, amount: true, currency: true },
            },
          },
        },
        paymentIntents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            salon: { select: { id: true, name: true } },
            appointment: {
              select: {
                id: true,
                service: { select: { id: true, name: true } },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            salon: { select: { id: true, name: true } },
          },
        },
        adminProfile: true,
      },
    })
    if (!target) throw new NotFoundException('User not found')

    const appointments = target.appointments ?? []
    const paymentIntents = target.paymentIntents ?? []
    const successfulTransactions = paymentIntents.filter((item) => item.status === PaymentStatus.SUCCEEDED)

    return {
      item: {
        ...this.mapUserDetail(target),
        account: {
          id: target.id,
          role: target.role,
          isActive: target.isActive,
          createdAt: target.createdAt.toISOString(),
          updatedAt: target.updatedAt.toISOString(),
        },
        clientProfile: target.clientProfile
          ? {
              ...target.clientProfile,
              questionnaire: target.clientProfile.questionnaire ?? null,
            }
          : null,
        employeeProfile: target.employeeProfile
          ? {
              id: target.employeeProfile.id,
              displayName: target.employeeProfile.displayName,
              firstName: target.employeeProfile.firstName,
              lastName: target.employeeProfile.lastName,
              salon: target.employeeProfile.salon,
              specialties: target.employeeProfile.specialties.map((item) => item.specialty),
              isActive: target.employeeProfile.isActive,
              appointments: target.employeeProfile.appointments.map((item) => this.mapAppointment(item)),
            }
          : null,
        paymentMethods: target.paymentMethods.map((item) => ({
          id: item.id,
          type: item.type,
          provider: item.provider,
          label: item.label,
          phone: item.phone,
          last4: item.last4,
          isDefault: item.isDefault,
          isActive: item.isActive,
        })),
        loyalty: target.loyaltyAccount
          ? {
              tier: target.loyaltyAccount.tier,
              currentPoints: target.loyaltyAccount.currentPoints,
              lifetimePoints: target.loyaltyAccount.lifetimePoints,
              pendingDiscountAmount: target.loyaltyAccount.pendingDiscountAmount,
              pendingDiscountTier: target.loyaltyAccount.pendingDiscountTier,
              transactions: target.loyaltyAccount.transactions.map((item) => ({
                id: item.id,
                deltaPoints: item.deltaPoints,
                reason: item.reason,
                createdAt: item.createdAt.toISOString(),
              })),
            }
          : null,
        transactions: paymentIntents.map((item) => ({
          id: item.id,
          status: item.status,
          amount: item.payableAmount || item.amount,
          currency: item.currency,
          provider: item.provider,
          createdAt: item.createdAt.toISOString(),
          salonName: item.salon?.name ?? null,
          serviceName: item.appointment?.service?.name ?? null,
        })),
        appointments: appointments.map((item) => this.mapAppointment(item)),
        analytics: {
          totalAppointments: appointments.length,
          cancelledAppointments: appointments.filter(
            (item) =>
              item.status === AppointmentStatus.CANCELLED ||
              item.status === AppointmentStatus.REJECTED,
          ).length,
          completedAppointments: appointments.filter((item) => item.status === AppointmentStatus.COMPLETED).length,
          noShows: appointments.filter((item) => item.status === AppointmentStatus.NO_SHOW).length,
          salonsVisited: this.countByLabel(appointments.map((item) => item.salon.name)).slice(0, 5),
          topServices: this.countByLabel(appointments.map((item) => item.service.name)).slice(0, 5),
          totalSpent: successfulTransactions.reduce(
            (sum, item) => sum + (item.payableAmount || item.amount || 0),
            0,
          ),
          lastActivityAt:
            appointments[0]?.startAt?.toISOString() ??
            paymentIntents[0]?.createdAt?.toISOString() ??
            null,
        },
        recentReviews: target.reviews.map((item) => ({
          id: item.id,
          rating: item.rating,
          comment: item.comment,
          createdAt: item.createdAt.toISOString(),
          salonName: item.salon.name,
        })),
      },
    }
  }

  async updateUser(user: JwtUser, userId: string, dto: UpdateUserDto) {
    await this.assertAdmin(user)
    const target = await this.findUserOrThrow(userId)
    if (target.role === UserRole.ADMIN) {
      throw new BadRequestException('Use admin endpoints for admin accounts')
    }

    await this.ensureUniqueUserFields(
      {
        email: dto.email?.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
      },
      target.id,
    )

    const previous = this.mapUserDetail(target)
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: {
          email: dto.email?.trim().toLowerCase() ?? undefined,
          phone: dto.phone?.trim() || undefined,
          isActive: dto.isActive ?? undefined,
        },
      })

      const hasClientUpdates =
        target.role === UserRole.CLIENT &&
        [
          dto.nickname,
          dto.gender,
          dto.ageRange,
          dto.city,
          dto.country,
          dto.allergies,
          dto.comments,
          dto.questionnaire,
        ].some((value) => value !== undefined)

      if (hasClientUpdates) {
        const mergedQuestionnaire =
          dto.questionnaire === undefined
            ? undefined
            : this.mergeJson(target.clientProfile?.questionnaire, dto.questionnaire)

        await tx.clientProfile.upsert({
          where: { userId: target.id },
          create: {
            userId: target.id,
            nickname: dto.nickname?.trim() ?? target.clientProfile?.nickname ?? '',
            gender: dto.gender?.trim() ?? target.clientProfile?.gender ?? '',
            ageRange: dto.ageRange?.trim() ?? target.clientProfile?.ageRange ?? '',
            city: dto.city?.trim() ?? target.clientProfile?.city ?? '',
            country: dto.country?.trim() ?? target.clientProfile?.country ?? '',
            allergies: dto.allergies?.trim() ?? target.clientProfile?.allergies ?? null,
            comments: dto.comments?.trim() ?? target.clientProfile?.comments ?? null,
            questionnaire:
              dto.questionnaire === undefined
                ? (target.clientProfile?.questionnaire ?? Prisma.DbNull)
                : mergedQuestionnaire === null
                  ? Prisma.DbNull
                  : mergedQuestionnaire,
          },
          update: {
            nickname: dto.nickname?.trim() ?? undefined,
            gender: dto.gender?.trim() ?? undefined,
            ageRange: dto.ageRange?.trim() ?? undefined,
            city: dto.city?.trim() ?? undefined,
            country: dto.country?.trim() ?? undefined,
            allergies: dto.allergies?.trim() ?? undefined,
            comments: dto.comments?.trim() ?? undefined,
            questionnaire:
              dto.questionnaire === undefined
                ? undefined
                : mergedQuestionnaire === null
                  ? Prisma.DbNull
                  : mergedQuestionnaire,
          },
        })
      }

      if (target.employeeProfile) {
        const displayName =
          dto.displayName?.trim() ||
          [dto.firstName ?? target.employeeProfile.firstName, dto.lastName ?? target.employeeProfile.lastName]
            .filter(Boolean)
            .join(' ')
            .trim()

        await tx.employee.update({
          where: { id: target.employeeProfile.id },
          data: {
            firstName: dto.firstName ?? undefined,
            lastName: dto.lastName ?? undefined,
            displayName: displayName || target.employeeProfile.displayName,
            isActive: dto.employeeIsActive ?? undefined,
          },
        })

        if (dto.specialties) {
          await tx.employeeSpecialtyAssignment.deleteMany({
            where: { employeeId: target.employeeProfile.id },
          })

          if (dto.specialties.length > 0) {
            await tx.employeeSpecialtyAssignment.createMany({
              data: Array.from(new Set(dto.specialties)).map((specialty) => ({
                employeeId: target.employeeProfile!.id,
                specialty,
              })),
            })
          }
        }
      }
    })

    const refreshed = await this.findUserOrThrow(target.id)
    await this.audit.logCrudMutation({
      action: 'update',
      entityType: 'user',
      entityId: target.id,
      oldValue: previous,
      newValue: this.mapUserDetail(refreshed),
    })

    return { item: this.mapUserDetail(refreshed) }
  }

  async listSalons(user: JwtUser, query: ListSalonsQueryDto) {
    await this.assertAdmin(user)
    const q = query.q?.trim()
    const salons = await this.prisma.salon.findMany({
      where: {
        ...(query.isActive ? { isActive: query.isActive === 'true' } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        owner: { select: { id: true, email: true, phone: true } },
        _count: { select: { services: true, employees: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { items: salons.map((item) => this.mapSalon(item)), total: salons.length }
  }

  async getSalon(user: JwtUser, salonId: string) {
    await this.assertAdmin(user)
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        owner: { select: { id: true, email: true, phone: true, isActive: true } },
        services: {
          select: { id: true, name: true, category: true, price: true, durationMin: true, isActive: true },
          orderBy: { name: 'asc' },
        },
        employees: {
          include: {
            user: { select: { email: true, phone: true, isActive: true } },
            specialties: { select: { specialty: true } },
          },
          orderBy: { displayName: 'asc' },
        },
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 20,
          include: {
            service: { select: { id: true, name: true, category: true, price: true } },
            client: {
              select: {
                id: true,
                email: true,
                phone: true,
                clientProfile: { select: { nickname: true } },
              },
            },
            employee: { select: { id: true, displayName: true } },
            paymentIntents: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, status: true, payableAmount: true, amount: true, currency: true },
            },
          },
        },
        paymentIntents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            client: {
              select: {
                id: true,
                email: true,
                clientProfile: { select: { nickname: true } },
              },
            },
          },
        },
        _count: { select: { appointments: true, employees: true, services: true } },
      },
    })
    if (!salon) throw new NotFoundException('Salon not found')

    const revenueTransactions = salon.paymentIntents.filter((item) => item.status === PaymentStatus.SUCCEEDED)

    return {
      item: {
        ...this.mapSalonDetail(salon),
        owner: salon.owner,
        professionals: salon.owner ? [salon.owner] : [],
        employees: salon.employees.map((item) => ({
          id: item.id,
          displayName: item.displayName,
          firstName: item.firstName,
          lastName: item.lastName,
          isActive: item.isActive,
          email: item.user.email,
          phone: item.user.phone,
          specialties: item.specialties.map((specialty) => specialty.specialty),
        })),
        services: salon.services,
        appointments: salon.appointments.map((item) => this.mapAppointment(item)),
        payments: salon.paymentIntents.map((item) => ({
          id: item.id,
          status: item.status,
          amount: item.payableAmount || item.amount,
          currency: item.currency,
          provider: item.provider,
          createdAt: item.createdAt.toISOString(),
        })),
        analytics: {
          totalRevenue: revenueTransactions.reduce(
            (sum, item) => sum + (item.payableAmount || item.amount || 0),
            0,
          ),
          ambyaRevenue: revenueTransactions.reduce(
            (sum, item) => sum + (item.platformFeeAmount || 0),
            0,
          ),
          transactionsCount: salon.paymentIntents.length,
          appointmentsByStatus: salon.appointments.reduce<Record<string, number>>((acc, item) => {
            acc[item.status] = (acc[item.status] ?? 0) + 1
            return acc
          }, {}),
          topServices: this.countByLabel(salon.appointments.map((item) => item.service.name)).slice(0, 5),
        },
        recentReviews: salon.reviews.map((item) => ({
          id: item.id,
          rating: item.rating,
          comment: item.comment,
          createdAt: item.createdAt.toISOString(),
          clientName: this.getClientDisplayName(item.client),
        })),
      },
    }
  }

  async updateSalon(user: JwtUser, salonId: string, dto: UpdateSalonDto) {
    await this.assertAdmin(user)
    const salon = await this.findSalonOrThrow(salonId)
    const previous = this.mapSalonDetail(salon)

    await this.prisma.$transaction(async (tx) => {
      await tx.salon.update({
        where: { id: salonId },
        data: {
          name: dto.name ?? undefined,
          description: dto.description ?? undefined,
          address: dto.address ?? undefined,
          city: dto.city ?? undefined,
          country: dto.country ?? undefined,
          phone: dto.phone ?? undefined,
          isActive: dto.isActive ?? undefined,
          openingHours: dto.openingHours ? this.normalizeOpeningHours(dto.openingHours) : undefined,
        },
      })

      if (dto.services?.length) {
        const allowedServiceIds = new Set(salon.services.map((item) => item.id))

        for (const service of dto.services) {
          if (!allowedServiceIds.has(service.id)) {
            throw new BadRequestException('Service does not belong to this salon')
          }

          await tx.service.update({
            where: { id: service.id },
            data: {
              name: service.name?.trim() || undefined,
              price: service.price ?? undefined,
              durationMin: service.durationMin ?? undefined,
              isActive: service.isActive ?? undefined,
            },
          })
        }
      }
    })

    const refreshed = await this.findSalonOrThrow(salonId)
    await this.audit.logCrudMutation({
      action: 'update',
      entityType: 'salon',
      entityId: salonId,
      oldValue: previous,
      newValue: this.mapSalonDetail(refreshed),
    })

    return { item: this.mapSalonDetail(refreshed) }
  }

  async listAppointments(user: JwtUser, query: ListAppointmentsQueryDto) {
    await this.assertAdmin(user)
    const q = query.q?.trim()
    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId: query.salonId ?? undefined,
        status: query.status ?? undefined,
        ...(q
          ? {
              OR: [
                { salon: { name: { contains: q, mode: 'insensitive' } } },
                { service: { name: { contains: q, mode: 'insensitive' } } },
                { client: { email: { contains: q, mode: 'insensitive' } } },
                { client: { phone: { contains: q } } },
                { client: { clientProfile: { nickname: { contains: q, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: {
        salon: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, category: true, price: true } },
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            clientProfile: { select: { nickname: true } },
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              orderBy: { specialty: 'asc' },
              select: { specialty: true },
            },
          },
        },
        paymentIntents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true, payableAmount: true, currency: true },
        },
      },
      orderBy: { startAt: 'desc' },
    })

    return { items: appointments.map((item) => this.mapAppointment(item)), total: appointments.length }
  }

  async getAppointment(user: JwtUser, appointmentId: string) {
    await this.assertAdmin(user)
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            employees: {
              where: { isActive: true },
              orderBy: { displayName: 'asc' },
              select: {
                id: true,
                displayName: true,
                specialties: {
                  orderBy: { specialty: 'asc' },
                  select: { specialty: true },
                },
              },
            },
          },
        },
        service: { select: { id: true, name: true, category: true, price: true, durationMin: true } },
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            createdAt: true,
            clientProfile: true,
            loyaltyAccount: {
              include: {
                transactions: {
                  orderBy: { createdAt: 'desc' },
                  take: 8,
                },
              },
            },
            paymentMethods: {
              orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            },
            appointments: {
              orderBy: { startAt: 'desc' },
              take: 6,
              include: {
                salon: { select: { id: true, name: true } },
                service: { select: { id: true, name: true } },
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              orderBy: { specialty: 'asc' },
              select: { specialty: true },
            },
          },
        },
        paymentIntents: {
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            status: true,
            payableAmount: true,
            amount: true,
            currency: true,
            provider: true,
            createdAt: true,
          },
        },
      },
    })
    if (!appointment) throw new NotFoundException('Appointment not found')

    return {
      item: {
        ...this.mapAppointmentDetail(appointment),
        salon: appointment.salon,
        service: appointment.service,
        availableEmployees: appointment.salon.employees.map((employee) => ({
          id: employee.id,
          displayName: employee.displayName,
          specialties: getEmployeeSpecialtyLabels(employee.specialties),
          primarySpecialtyLabel: getPrimaryEmployeeSpecialtyLabel(employee.specialties),
        })),
        client: {
          id: appointment.client.id,
          name: this.getClientDisplayName(appointment.client),
          email: appointment.client.email,
          phone: appointment.client.phone,
          createdAt: appointment.client.createdAt.toISOString(),
          profile: appointment.client.clientProfile
            ? {
                ...appointment.client.clientProfile,
                questionnaire: appointment.client.clientProfile.questionnaire ?? null,
              }
            : null,
          loyalty: appointment.client.loyaltyAccount
            ? {
                tier: appointment.client.loyaltyAccount.tier,
                currentPoints: appointment.client.loyaltyAccount.currentPoints,
                transactions: appointment.client.loyaltyAccount.transactions.map((item) => ({
                  id: item.id,
                  deltaPoints: item.deltaPoints,
                  reason: item.reason,
                  createdAt: item.createdAt.toISOString(),
                })),
              }
            : null,
          paymentMethods: appointment.client.paymentMethods.map((item) => ({
            id: item.id,
            type: item.type,
            provider: item.provider,
            label: item.label,
            last4: item.last4,
            phone: item.phone,
            isDefault: item.isDefault,
          })),
          recentAppointments: appointment.client.appointments.map((item) => ({
            id: item.id,
            status: item.status,
            startAt: item.startAt.toISOString(),
            salonName: item.salon.name,
            serviceName: item.service.name,
          })),
        },
      },
    }
  }

  async updateAppointment(user: JwtUser, appointmentId: string, dto: UpdateAppointmentDto) {
    await this.assertAdmin(user)
    const appointment = await this.findAppointmentOrThrow(appointmentId)
    const previous = this.mapAppointmentDetail(appointment)

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: dto.employeeId, salonId: appointment.salon.id },
        select: { id: true },
      })
      if (!employee) {
        throw new BadRequestException('Employee does not belong to this salon')
      }
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : undefined
    const endAt = dto.endAt ? new Date(dto.endAt) : undefined
    if ((startAt && !endAt) || (!startAt && endAt)) {
      throw new BadRequestException('startAt and endAt must be updated together')
    }
    if (startAt && endAt && endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt')
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status ?? undefined,
        employeeId: dto.employeeId === null ? null : dto.employeeId ?? undefined,
        startAt,
        endAt,
        note: dto.note === null ? null : dto.note ?? undefined,
      },
    })

    const refreshed = await this.findAppointmentOrThrow(appointmentId)
    await this.audit.logCrudMutation({
      action: 'update',
      entityType: 'appointment',
      entityId: appointmentId,
      oldValue: previous,
      newValue: this.mapAppointmentDetail(refreshed),
    })

    return { item: this.mapAppointmentDetail(refreshed) }
  }

  async listAuditLogs(user: JwtUser, query: ListAuditLogsQueryDto) {
    await this.assertAdmin(user)
    const logs = await this.prisma.auditLog.findMany({
      where: {
        actionType: query.actionType ? { contains: query.actionType, mode: 'insensitive' } : undefined,
        entityType: query.entityType ? { contains: query.entityType, mode: 'insensitive' } : undefined,
        actorUserId: query.actorUserId ?? undefined,
        createdAt:
          query.dateFrom || query.dateTo
            ? {
                gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
                lte: query.dateTo ? new Date(query.dateTo) : undefined,
              }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return {
      items: logs.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total: logs.length,
    }
  }

  private async assertAdmin(user: JwtUser, allowedScopes?: AdminScope[]) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin account required')
    }

    const current = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: { adminProfile: true },
    })

    if (!current) {
      throw new ForbiddenException('Admin account required')
    }

    const scope = current.adminProfile?.scope ?? AdminScope.SUPPORT
    if (allowedScopes && !allowedScopes.includes(scope)) {
      throw new ForbiddenException('Insufficient admin permissions')
    }

    return current
  }

  private async findAdminOrThrow(adminId: string) {
    const admin = await this.prisma.user.findFirst({
      where: { id: adminId, role: UserRole.ADMIN },
      include: { adminProfile: true },
    })
    if (!admin) throw new NotFoundException('Admin not found')
    return admin
  }

  private async findUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        employeeProfile: {
          include: {
            salon: { select: { id: true, name: true } },
            specialties: { select: { specialty: true } },
          },
        },
        ownedSalons: { select: { id: true, name: true } },
        adminProfile: true,
      },
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  private async findSalonOrThrow(salonId: string) {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        owner: { select: { id: true, email: true, phone: true } },
        services: {
          select: { id: true, name: true, category: true, price: true, durationMin: true, isActive: true },
          orderBy: { name: 'asc' },
        },
        employees: {
          select: { id: true, displayName: true, isActive: true },
          orderBy: { displayName: 'asc' },
        },
        _count: { select: { appointments: true, employees: true, services: true } },
      },
    })
    if (!salon) throw new NotFoundException('Salon not found')
    return salon
  }

  private async findAppointmentOrThrow(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        salon: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, category: true, price: true, durationMin: true } },
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            clientProfile: { select: { nickname: true } },
          },
        },
        employee: { select: { id: true, displayName: true } },
        paymentIntents: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            status: true,
            payableAmount: true,
            amount: true,
            currency: true,
            provider: true,
            createdAt: true,
          },
        },
      },
    })
    if (!appointment) throw new NotFoundException('Appointment not found')
    return appointment
  }

  private async ensureUniqueUserFields(
    values: { email?: string | null; phone?: string | null },
    excludeUserId?: string,
  ) {
    if (values.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: values.email },
        select: { id: true },
      })
      if (existing && existing.id !== excludeUserId) {
        throw new BadRequestException('Email already in use')
      }
    }

    if (values.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: values.phone },
        select: { id: true },
      })
      if (existing && existing.id !== excludeUserId) {
        throw new BadRequestException('Phone already in use')
      }
    }
  }

  private mapAdmin(item: any) {
    return {
      id: item.id,
      email: item.email,
      phone: item.phone,
      isActive: item.isActive,
      scope: item.adminProfile?.scope ?? AdminScope.SUPPORT,
      firstName: item.adminProfile?.firstName ?? '',
      lastName: item.adminProfile?.lastName ?? '',
      notes: item.adminProfile?.notes ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  }

  private mapUser(item: any) {
    return {
      id: item.id,
      role: item.role,
      email: item.email,
      phone: item.phone,
      isActive: item.isActive,
      displayName:
        item.clientProfile?.nickname ??
        item.employeeProfile?.displayName ??
        item.email?.split('@')[0] ??
        item.phone ??
        'Utilisateur',
      city: item.clientProfile?.city ?? null,
      country: item.clientProfile?.country ?? null,
      salonName: item.employeeProfile?.salon?.name ?? item.ownedSalons?.[0]?.name ?? null,
      createdAt: item.createdAt.toISOString(),
    }
  }

  private mapUserDetail(item: any) {
    return {
      ...this.mapUser(item),
      clientProfile: item.clientProfile
        ? {
            nickname: item.clientProfile.nickname,
            gender: item.clientProfile.gender,
            ageRange: item.clientProfile.ageRange,
            city: item.clientProfile.city,
            country: item.clientProfile.country,
            allergies: item.clientProfile.allergies,
            comments: item.clientProfile.comments,
          }
        : null,
      employeeProfile: item.employeeProfile
        ? {
            id: item.employeeProfile.id,
            displayName: item.employeeProfile.displayName,
            firstName: item.employeeProfile.firstName,
            lastName: item.employeeProfile.lastName,
            salon: item.employeeProfile.salon,
            isActive: item.employeeProfile.isActive,
            specialties: item.employeeProfile.specialties?.map((entry: any) => entry.specialty) ?? [],
          }
        : null,
      ownedSalons: item.ownedSalons ?? [],
    }
  }

  private mapSalon(item: any) {
    return {
      id: item.id,
      name: item.name,
      city: item.city,
      country: item.country,
      address: item.address,
      phone: item.phone,
      isActive: item.isActive,
      ownerEmail: item.owner?.email ?? null,
      ownerPhone: item.owner?.phone ?? null,
      servicesCount: item._count?.services ?? 0,
      employeesCount: item._count?.employees ?? 0,
      appointmentsCount: item._count?.appointments ?? 0,
      createdAt: item.createdAt.toISOString(),
    }
  }

  private mapSalonDetail(item: any) {
    return {
      ...this.mapSalon(item),
      description: item.description,
      latitude: item.latitude,
      longitude: item.longitude,
      openingHours: this.normalizeOpeningHours(item.openingHours),
      services: item.services,
      employees: item.employees,
    }
  }

  private mapAppointment(item: any) {
    const payment = item.paymentIntents?.[0] ?? null
    return {
      id: item.id,
      status: item.status,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt.toISOString(),
      note: item.note,
      salon: item.salon,
      service: item.service,
      client: {
        id: item.client?.id ?? item.clientId ?? '',
        name: this.getClientDisplayName(item.client),
        email: item.client?.email ?? null,
        phone: item.client?.phone ?? null,
      },
      employee: item.employee
        ? {
            id: item.employee.id,
            displayName: item.employee.displayName,
            specialties: getEmployeeSpecialtyLabels(item.employee.specialties ?? []),
            primarySpecialtyLabel: getPrimaryEmployeeSpecialtyLabel(item.employee.specialties ?? []),
          }
        : null,
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            amount: payment.payableAmount,
            currency: payment.currency,
          }
        : null,
    }
  }

  private mapAppointmentDetail(item: any) {
    return {
      ...this.mapAppointment(item),
      payments: (item.paymentIntents ?? []).map((intent: any) => ({
        id: intent.id,
        status: intent.status,
        amount: intent.payableAmount || intent.amount,
        currency: intent.currency,
        provider: intent.provider,
        createdAt: intent.createdAt.toISOString(),
      })),
    }
  }

  private countByLabel(labels: string[]) {
    return Object.entries(
      labels.reduce<Record<string, number>>((acc, label) => {
        acc[label] = (acc[label] ?? 0) + 1
        return acc
      }, {}),
    )
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)
  }

  private sumByLabel(items: Array<{ label: string; value: number }>) {
    return Object.entries(
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item.label] = (acc[item.label] ?? 0) + item.value
        return acc
      }, {}),
    )
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)
  }

  private rateOf(part: number, total: number) {
    if (!total) return 0
    return Math.round((part / total) * 1000) / 10
  }

  private sumPaymentsFrom(items: Array<{ createdAt: Date; payableAmount: number; amount: number }>, from: Date) {
    return items
      .filter((item) => item.createdAt >= from)
      .reduce((sum, item) => sum + (item.payableAmount || item.amount || 0), 0)
  }

  private getClientDisplayName(client: any) {
    return (
      client?.clientProfile?.nickname ??
      client?.email?.split('@')[0] ??
      client?.phone ??
      'Client'
    )
  }

  private mergeJson(base: unknown, patch: Record<string, any>) {
    const target = base && typeof base === 'object' ? (base as Record<string, any>) : {}
    const source = patch && typeof patch === 'object' ? patch : {}

    const deepMerge = (left: Record<string, any>, right: Record<string, any>) => {
      const out: Record<string, any> = { ...left }
      for (const [key, value] of Object.entries(right)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          out[key] = deepMerge(out[key] ?? {}, value)
        } else {
          out[key] = value
        }
      }
      return out
    }

    return deepMerge(target, source)
  }

  private normalizeOpeningHours(raw: unknown) {
    if (!Array.isArray(raw)) return []

    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const entry = item as Record<string, unknown>
        const day = typeof entry.day === 'string' ? entry.day : null
        if (!day) return null

        const closed = Boolean(entry.closed)
        const open = typeof entry.open === 'string' && entry.open.trim() ? entry.open.trim() : null
        const close = typeof entry.close === 'string' && entry.close.trim() ? entry.close.trim() : null

        return {
          day,
          open: closed ? null : open,
          close: closed ? null : close,
          closed,
        }
      })
      .filter((item): item is { day: string; open: string | null; close: string | null; closed: boolean } => Boolean(item))
  }
}
