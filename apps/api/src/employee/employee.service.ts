import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  AppointmentStatus,
  PaymentStatus,
  ServiceCategory,
  UserRole,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { ListEmployeeScheduleQueryDto } from './dto/list-employee-schedule-query.dto'
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto'
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto'
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto'

type ScheduleKind = 'appointment' | 'blocked_slot'

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(user: JwtUser) {
    const employee = await this.getEmployeeContext(user)
    const [appointments, blockedSlots, services] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          employeeId: employee.id,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
          client: {
            select: {
              id: true,
              email: true,
              phone: true,
              clientProfile: {
                select: {
                  nickname: true,
                },
              },
            },
          },
          paymentIntents: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true },
          },
        },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.employeeBlockedSlot.findMany({
        where: {
          employeeId: employee.id,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
        },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.service.findMany({
        where: {
          salonId: employee.salonId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          category: true,
          durationMin: true,
          price: true,
        },
        orderBy: { name: 'asc' },
      }),
    ])

    const items = [
      ...appointments.map((item) => this.mapAppointmentSummary(item)),
      ...blockedSlots.map((item) => this.mapBlockedSlotSummary(item)),
    ].sort((left, right) => left.startAt.localeCompare(right.startAt))

    const now = new Date()
    const todayKey = now.toISOString().slice(0, 10)
    const weekEnd = new Date(now)
    weekEnd.setUTCDate(now.getUTCDate() + 7)

    const todayItems = items.filter((item) => item.startAt.slice(0, 10) === todayKey)
    const weekItems = items.filter((item) => {
      const at = new Date(item.startAt)
      return at >= now && at <= weekEnd
    })

    return {
      profile: {
        firstName: employee.firstName ?? this.extractNameParts(employee.displayName).firstName,
        lastName: employee.lastName ?? this.extractNameParts(employee.displayName).lastName,
        role: 'Employe',
        salon: employee.salon.name,
      },
      metrics: {
        todayCount: todayItems.length,
        weekCount: weekItems.length,
      },
      services,
      todayItems,
    }
  }

  async listScheduleItems(user: JwtUser, query: ListEmployeeScheduleQueryDto) {
    const employee = await this.getEmployeeContext(user)
    const [appointments, blockedSlots] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          employeeId: employee.id,
          status: {
            in: [
              AppointmentStatus.PENDING,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.COMPLETED,
            ],
          },
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
          client: {
            select: {
              id: true,
              email: true,
              phone: true,
              clientProfile: {
                select: {
                  nickname: true,
                },
              },
            },
          },
          paymentIntents: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true },
          },
        },
      }),
      this.prisma.employeeBlockedSlot.findMany({
        where: {
          employeeId: employee.id,
          status: {
            in: [
              AppointmentStatus.PENDING,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.COMPLETED,
            ],
          },
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
        },
      }),
    ])

    const status = query.status ?? 'all'
    const items = [
      ...appointments.map((item) => this.mapAppointmentSummary(item)),
      ...blockedSlots.map((item) => this.mapBlockedSlotSummary(item)),
    ]
      .filter((item) => this.matchesEmployeeTab(item.status, status))
      .sort((left, right) => {
        if (left.status === AppointmentStatus.COMPLETED && right.status !== AppointmentStatus.COMPLETED) {
          return 1
        }
        if (left.status !== AppointmentStatus.COMPLETED && right.status === AppointmentStatus.COMPLETED) {
          return -1
        }
        return left.startAt.localeCompare(right.startAt)
      })

    return { items, total: items.length }
  }

  async getScheduleItemDetails(user: JwtUser, kind: string, id: string) {
    const employee = await this.getEmployeeContext(user)
    const scheduleKind = this.parseScheduleKind(kind)

    if (scheduleKind === 'appointment') {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          employeeId: employee.id,
        },
        include: {
          salon: { select: { id: true, name: true } },
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
          client: {
            select: {
              id: true,
              email: true,
              phone: true,
              clientProfile: {
                select: {
                  nickname: true,
                  allergies: true,
                  comments: true,
                  questionnaire: true,
                },
              },
            },
          },
          paymentIntents: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              amount: true,
              payableAmount: true,
              currency: true,
            },
          },
        },
      })
      if (!appointment) throw new NotFoundException('Schedule item not found')

      return {
        item: this.mapAppointmentDetail(appointment),
      }
    }

    const blockedSlot = await this.prisma.employeeBlockedSlot.findFirst({
      where: {
        id,
        employeeId: employee.id,
      },
      include: {
        salon: { select: { id: true, name: true } },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
      },
    })
    if (!blockedSlot) throw new NotFoundException('Schedule item not found')

    return {
      item: this.mapBlockedSlotDetail(blockedSlot),
    }
  }

  async confirmScheduleItem(user: JwtUser, kind: string, id: string) {
    const employee = await this.getEmployeeContext(user)
    const scheduleKind = this.parseScheduleKind(kind)

    if (scheduleKind === 'blocked_slot') {
      const blockedSlot = await this.prisma.employeeBlockedSlot.findFirst({
        where: { id, employeeId: employee.id },
      })
      if (!blockedSlot) throw new NotFoundException('Schedule item not found')
      return { item: this.mapBlockedSlotSummary(blockedSlot) }
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        salonId: employee.salonId,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: { id: true, status: true },
        },
      },
    })

    if (!appointment) throw new NotFoundException('Schedule item not found')
    if (
      appointment.employeeId &&
      appointment.employeeId !== employee.id
    ) {
      throw new ForbiddenException('Appointment is assigned to another employee')
    }
    if (
      appointment.status !== AppointmentStatus.PENDING &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException('Appointment cannot be confirmed')
    }

    await this.ensureNoConflict(
      employee.id,
      employee.salonId,
      appointment.startAt,
      appointment.endAt,
      { excludeAppointmentId: appointment.id },
    )

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        employeeId: employee.id,
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: { id: true, status: true },
        },
      },
    })

    return { item: this.mapAppointmentSummary(updated) }
  }

  async completeScheduleItem(user: JwtUser, kind: string, id: string) {
    const employee = await this.getEmployeeContext(user)
    const scheduleKind = this.parseScheduleKind(kind)

    if (scheduleKind === 'blocked_slot') {
      const blockedSlot = await this.prisma.employeeBlockedSlot.findFirst({
        where: { id, employeeId: employee.id },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
        },
      })
      if (!blockedSlot) throw new NotFoundException('Schedule item not found')
      if (
        blockedSlot.status !== AppointmentStatus.PENDING &&
        blockedSlot.status !== AppointmentStatus.CONFIRMED
      ) {
        throw new BadRequestException('Schedule item cannot be completed')
      }

      const updated = await this.prisma.employeeBlockedSlot.update({
        where: { id: blockedSlot.id },
        data: { status: AppointmentStatus.COMPLETED },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
        },
      })
      return { item: this.mapBlockedSlotSummary(updated) }
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: { id, employeeId: employee.id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: { id: true, status: true },
        },
      },
    })
    if (!appointment) throw new NotFoundException('Schedule item not found')
    if (
      appointment.status !== AppointmentStatus.PENDING &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException('Schedule item cannot be completed')
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.COMPLETED },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: { id: true, status: true },
        },
      },
    })
    return { item: this.mapAppointmentSummary(updated) }
  }

  async payScheduleItem(user: JwtUser, kind: string, id: string) {
    const employee = await this.getEmployeeContext(user)
    const scheduleKind = this.parseScheduleKind(kind)

    if (scheduleKind === 'blocked_slot') {
      const blockedSlot = await this.prisma.employeeBlockedSlot.findFirst({
        where: { id, employeeId: employee.id },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
        },
      })
      if (!blockedSlot) throw new NotFoundException('Schedule item not found')
      if (blockedSlot.isPaid) {
        return { item: this.mapBlockedSlotSummary(blockedSlot) }
      }

      const updated = await this.prisma.employeeBlockedSlot.update({
        where: { id: blockedSlot.id },
        data: { isPaid: true },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              durationMin: true,
              price: true,
            },
          },
        },
      })
      return { item: this.mapBlockedSlotSummary(updated) }
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: { id, employeeId: employee.id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: {
            id: true,
            status: true,
            amount: true,
            payableAmount: true,
            currency: true,
          },
        },
      },
    })
    if (!appointment) throw new NotFoundException('Schedule item not found')

    await this.prisma.$transaction(async (tx) => {
      const lastIntent = await tx.paymentIntent.findFirst({
        where: { appointmentId: appointment.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          amount: true,
          payableAmount: true,
          currency: true,
        },
      })

      if (!lastIntent) {
        await tx.paymentIntent.create({
          data: {
            userId: appointment.client.id,
            salonId: employee.salonId,
            appointmentId: appointment.id,
            amount: appointment.service.price,
            discountAmount: 0,
            payableAmount: appointment.service.price,
            currency: 'XAF',
            status: PaymentStatus.SUCCEEDED,
            provider: 'INTERNAL_BETA',
            providerRef: `employee-pay-${appointment.id}`,
            providerData: {
              source: 'employee_beta',
              employeeId: employee.id,
            },
            platformFeeAmount: 0,
            providerFeeAmount: 0,
            netAmount: appointment.service.price,
          },
        })
      } else if (lastIntent.status !== PaymentStatus.SUCCEEDED) {
        await tx.paymentIntent.update({
          where: { id: lastIntent.id },
          data: {
            status: PaymentStatus.SUCCEEDED,
            provider: 'INTERNAL_BETA',
            providerRef: `employee-pay-${appointment.id}`,
            providerData: {
              source: 'employee_beta',
              employeeId: employee.id,
            },
          },
        })
      }

      if (appointment.status === AppointmentStatus.PENDING) {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: AppointmentStatus.CONFIRMED },
        })
      }
    })

    const refreshed = await this.prisma.appointment.findFirst({
      where: { id, employeeId: employee.id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: { id: true, status: true },
        },
      },
    })
    if (!refreshed) throw new NotFoundException('Schedule item not found')

    return { item: this.mapAppointmentSummary(refreshed) }
  }

  async listAvailableSlots(user: JwtUser) {
    const employee = await this.getEmployeeContext(user)
    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId: employee.salonId,
        employeeId: null,
        status: AppointmentStatus.PENDING,
        startAt: { gte: new Date() },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            clientProfile: { select: { nickname: true } },
          },
        },
      },
      orderBy: { startAt: 'asc' },
    })

    const items: Array<{
      id: string
      kind: 'appointment'
      clientName: string
      clientPhone: string | null
      startAt: string
      endAt: string
      service: {
        id: string
        name: string
        category: ServiceCategory
        durationMin: number
        price: number
      }
      amount: number
      isClaimable: boolean
    }> = []
    for (const appointment of appointments) {
      const hasConflict = await this.hasEmployeeConflict(
        employee.id,
        employee.salonId,
        appointment.startAt,
        appointment.endAt,
      )

      items.push({
        id: appointment.id,
        kind: 'appointment',
        clientName: this.getClientDisplayName(appointment.client),
        clientPhone: appointment.client.phone,
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
        service: appointment.service,
        amount: appointment.service.price,
        isClaimable: !hasConflict,
      })
    }

    return { items, total: items.length }
  }

  async claimAvailableSlot(user: JwtUser, appointmentId: string) {
    const employee = await this.getEmployeeContext(user)
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        salonId: employee.salonId,
        employeeId: null,
        status: AppointmentStatus.PENDING,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: { id: true, status: true },
        },
      },
    })
    if (!appointment) throw new NotFoundException('Available slot not found')

    await this.ensureNoConflict(
      employee.id,
      employee.salonId,
      appointment.startAt,
      appointment.endAt,
      { excludeAppointmentId: appointment.id },
    )

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        employeeId: employee.id,
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
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
          select: { id: true, status: true },
        },
      },
    })

    return { item: this.mapAppointmentSummary(updated) }
  }

  async createBlockedSlot(user: JwtUser, dto: CreateBlockedSlotDto) {
    const employee = await this.getEmployeeContext(user)
    const startAt = new Date(dto.startAt)
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt')
    }

    const service = await this.prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        salonId: employee.salonId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
        durationMin: true,
        price: true,
      },
    })
    if (!service) throw new BadRequestException('Service not found')

    const endAt = new Date(startAt.getTime() + service.durationMin * 60_000)
    await this.ensureNoConflict(employee.id, employee.salonId, startAt, endAt)

    const blockedSlot = await this.prisma.employeeBlockedSlot.create({
      data: {
        salonId: employee.salonId,
        employeeId: employee.id,
        serviceId: service.id,
        clientName: dto.clientName.trim(),
        clientPhone: dto.clientPhone.trim(),
        note: dto.note?.trim() || null,
        startAt,
        endAt,
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMin: true,
            price: true,
          },
        },
      },
    })

    return { item: this.mapBlockedSlotSummary(blockedSlot) }
  }

  async listLeaveRequests(user: JwtUser) {
    const employee = await this.getEmployeeContext(user)
    const items = await this.prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
    })

    return {
      items: items.map((item) => ({
        id: item.id,
        startAt: item.startAt,
        endAt: item.endAt,
        reason: item.reason,
        status: item.status,
        managerNote: item.managerNote,
        reviewedAt: item.reviewedAt,
        createdAt: item.createdAt,
      })),
      total: items.length,
    }
  }

  async createLeaveRequest(user: JwtUser, dto: CreateLeaveRequestDto) {
    const employee = await this.getEmployeeContext(user)
    const startAt = new Date(dto.startAt)
    const endAt = new Date(dto.endAt)

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid leave dates')
    }
    if (endAt < startAt) {
      throw new BadRequestException('endAt must be after startAt')
    }

    const item = await this.prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        startAt,
        endAt,
        reason: dto.reason.trim(),
      },
    })

    return { item }
  }

  async getProfile(user: JwtUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.userId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    if (!employee) throw new ForbiddenException('Employee account required')

    const fallback = this.extractNameParts(employee.displayName)
    return {
      profile: {
        firstName: employee.firstName ?? fallback.firstName,
        lastName: employee.lastName ?? fallback.lastName,
        email: employee.user.email,
        phone: employee.user.phone,
        role: 'Employe',
        salon: employee.salon.name,
      },
    }
  }

  async updateProfile(user: JwtUser, dto: UpdateEmployeeProfileDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.userId },
      include: {
        user: true,
        salon: {
          select: { name: true },
        },
      },
    })
    if (!employee) throw new ForbiddenException('Employee account required')

    if (dto.email && dto.email !== employee.user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      })
      if (existing && existing.id !== employee.userId) {
        throw new BadRequestException('Email already in use')
      }
    }

    if (dto.phone && dto.phone !== employee.user.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
        select: { id: true },
      })
      if (existing && existing.id !== employee.userId) {
        throw new BadRequestException('Phone already in use')
      }
    }

    const firstName =
      dto.firstName ??
      employee.firstName ??
      this.extractNameParts(employee.displayName).firstName
    const lastName =
      dto.lastName ??
      employee.lastName ??
      this.extractNameParts(employee.displayName).lastName
    const displayName =
      [firstName, lastName].filter(Boolean).join(' ').trim() || employee.displayName

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: employee.userId },
        data: {
          email: dto.email ?? undefined,
          phone: dto.phone ?? undefined,
        },
      })

      return tx.employee.update({
        where: { id: employee.id },
        data: {
          firstName,
          lastName,
          displayName,
        },
        include: {
          user: {
            select: {
              email: true,
              phone: true,
            },
          },
          salon: {
            select: { name: true },
          },
        },
      })
    })

    return {
      profile: {
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
        email: updated.user.email,
        phone: updated.user.phone,
        role: 'Employe',
        salon: updated.salon.name,
      },
    }
  }

  private async getEmployeeContext(user: JwtUser) {
    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Employee account required')
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.userId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    if (!employee) {
      throw new ForbiddenException('Employee account required')
    }
    return employee
  }

  private parseScheduleKind(kind: string): ScheduleKind {
    if (kind === 'appointment' || kind === 'blocked_slot') return kind
    throw new BadRequestException('Invalid schedule item kind')
  }

  private async ensureNoConflict(
    employeeId: string,
    salonId: string,
    startAt: Date,
    endAt: Date,
    options?: { excludeAppointmentId?: string; excludeBlockedSlotId?: string },
  ) {
    const hasConflict = await this.hasEmployeeConflict(
      employeeId,
      salonId,
      startAt,
      endAt,
      options,
    )

    if (hasConflict) {
      throw new BadRequestException('Employee is not available at this time')
    }
  }

  private async hasEmployeeConflict(
    employeeId: string,
    salonId: string,
    startAt: Date,
    endAt: Date,
    options?: { excludeAppointmentId?: string; excludeBlockedSlotId?: string },
  ) {
    const [appointmentConflict, blockedSlotConflict] = await Promise.all([
      this.prisma.appointment.findFirst({
        where: {
          salonId,
          employeeId,
          id: options?.excludeAppointmentId
            ? { not: options.excludeAppointmentId }
            : undefined,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { id: true },
      }),
      this.prisma.employeeBlockedSlot.findFirst({
        where: {
          salonId,
          employeeId,
          id: options?.excludeBlockedSlotId
            ? { not: options.excludeBlockedSlotId }
            : undefined,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { id: true },
      }),
    ])

    return Boolean(appointmentConflict || blockedSlotConflict)
  }

  private matchesEmployeeTab(
    status: AppointmentStatus,
    tab: 'all' | 'upcoming' | 'completed',
  ) {
    if (tab === 'all') return true
    if (tab === 'completed') return status === AppointmentStatus.COMPLETED
    return status !== AppointmentStatus.COMPLETED
  }

  private mapAppointmentSummary(appointment: any) {
    const paymentIntent = appointment.paymentIntents?.[0] ?? null
    return {
      kind: 'appointment',
      id: appointment.id,
      status: appointment.status,
      isPaid: paymentIntent?.status === PaymentStatus.SUCCEEDED,
      paymentStatus: paymentIntent?.status ?? PaymentStatus.CREATED,
      clientName: this.getClientDisplayName(appointment.client),
      clientPhone: appointment.client?.phone ?? null,
      service: appointment.service,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      amount: appointment.service.price,
      note: appointment.note ?? null,
    }
  }

  private mapBlockedSlotSummary(blockedSlot: any) {
    return {
      kind: 'blocked_slot',
      id: blockedSlot.id,
      status: blockedSlot.status,
      isPaid: blockedSlot.isPaid,
      paymentStatus: blockedSlot.isPaid
        ? PaymentStatus.SUCCEEDED
        : PaymentStatus.CREATED,
      clientName: blockedSlot.clientName,
      clientPhone: blockedSlot.clientPhone,
      service: blockedSlot.service,
      startAt: blockedSlot.startAt.toISOString(),
      endAt: blockedSlot.endAt.toISOString(),
      amount: blockedSlot.service.price,
      note: blockedSlot.note ?? null,
    }
  }

  private mapAppointmentDetail(appointment: any) {
    const paymentIntent = appointment.paymentIntents?.[0] ?? null
    return {
      ...this.mapAppointmentSummary(appointment),
      salon: appointment.salon,
      client: {
        id: appointment.client.id,
        name: this.getClientDisplayName(appointment.client),
        email: appointment.client.email,
        phone: appointment.client.phone,
        allergies: appointment.client.clientProfile?.allergies ?? null,
        comments: appointment.client.clientProfile?.comments ?? null,
      },
      insights: this.buildClientInsights(
        appointment.service.category,
        appointment.client.clientProfile?.questionnaire,
        appointment.client.clientProfile?.allergies,
        appointment.client.clientProfile?.comments,
      ),
      payment: paymentIntent
        ? {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.payableAmount || paymentIntent.amount,
            currency: paymentIntent.currency,
          }
        : null,
    }
  }

  private mapBlockedSlotDetail(blockedSlot: any) {
    return {
      ...this.mapBlockedSlotSummary(blockedSlot),
      salon: blockedSlot.salon,
      client: {
        id: null,
        name: blockedSlot.clientName,
        email: null,
        phone: blockedSlot.clientPhone,
        allergies: null,
        comments: blockedSlot.note ?? null,
      },
      insights: blockedSlot.note
        ? [
            {
              title: 'Informations utiles',
              items: [blockedSlot.note],
            },
          ]
        : [],
      payment: {
        id: null,
        status: blockedSlot.isPaid ? PaymentStatus.SUCCEEDED : PaymentStatus.CREATED,
        amount: blockedSlot.service.price,
        currency: 'XAF',
      },
    }
  }

  private buildClientInsights(
    category: ServiceCategory,
    questionnaire: unknown,
    allergies?: string | null,
    comments?: string | null,
  ) {
    const data =
      questionnaire && typeof questionnaire === 'object'
        ? (questionnaire as Record<string, any>)
        : {}

    const sections: Array<{ title: string; items: string[] }> = []
    const addSection = (title: string, value: unknown) => {
      const items = this.flattenProfileValue(value)
      if (items.length > 0) {
        sections.push({ title, items })
      }
    }

    if (category === ServiceCategory.HAIR || category === ServiceCategory.BARBER) {
      addSection('Profil cheveux', data.hair)
    }
    if (category === ServiceCategory.NAILS) {
      addSection('Profil ongles', data.nails)
    }
    if (category === ServiceCategory.FACE) {
      addSection('Profil visage', data.face)
    }
    if (category === ServiceCategory.BODY) {
      addSection('Profil bien-etre', data.body)
    }
    if (category === ServiceCategory.FITNESS) {
      addSection('Profil fitness', data.fitness)
    }

    const important: string[] = []
    if (allergies) important.push(`Allergies: ${this.humanizeValue(allergies)}`)
    if (comments?.trim()) important.push(`Commentaires: ${comments.trim()}`)
    if (important.length > 0) {
      sections.push({ title: 'Informations importantes', items: important })
    }

    return sections
  }

  private flattenProfileValue(value: unknown): string[] {
    if (!value || typeof value !== 'object') return []

    const items: string[] = []
    for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
      if (Array.isArray(rawValue)) {
        const values = rawValue
          .map((item) => this.humanizeValue(item))
          .filter(Boolean)
        if (values.length > 0) {
          items.push(`${this.humanizeLabel(key)}: ${values.join(', ')}`)
        }
        continue
      }

      if (typeof rawValue === 'string' && rawValue.trim()) {
        items.push(`${this.humanizeLabel(key)}: ${this.humanizeValue(rawValue)}`)
      }
    }

    return items
  }

  private humanizeLabel(value: string) {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  private humanizeValue(value: unknown) {
    if (typeof value !== 'string') return ''
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  private getClientDisplayName(client: any) {
    return (
      client?.clientProfile?.nickname ??
      client?.email?.split('@')[0] ??
      client?.phone ??
      'Client'
    )
  }

  private extractNameParts(displayName: string) {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
    }
  }
}
