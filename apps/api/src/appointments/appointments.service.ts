import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import ExcelJS from 'exceljs';
import {
  AppointmentStatus,
  LoyaltyReason,
  LoyaltyTier,
  PaymentStatus,
  Prisma,
  ServiceCategory,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AssignEmployeeDto } from './dto/assign-employee.dto';
import { CreateAppointmentsFromCartDto } from './dto/create-appointments-from-cart.dto';
import { UpdateAppointmentGroupDto } from './dto/update-appointment-group.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  employeeCanPerformCategory,
  getEmployeeSpecialtyLabels,
  getPrimaryEmployeeSpecialtyLabel,
} from '../common/employee-specialties'

const CLIENT_CANCELLATION_NOTICE_HOURS = 24;

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    user: { userId: string; role: UserRole },
    q: ListAppointmentsDto,
  ) {
    const where: Prisma.AppointmentWhereInput = {};

    if (user.role === UserRole.CLIENT) {
      where.clientId = user.userId;
    }

    if (user.role === UserRole.EMPLOYEE) {
      const employee = await this.prisma.employee.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });

      if (!employee) {
        throw new ForbiddenException();
      }

      where.employeeId = employee.id;
    }

    if (user.role === UserRole.PROFESSIONAL) {
      const salons = await this.prisma.salon.findMany({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      where.salonId = { in: salons.map((salon) => salon.id) };
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { startAt: 'desc' },
        skip: q.skip ?? 0,
        take: q.take ?? 20,
        include: {
          salon: { select: { id: true, name: true } },
          service: {
            select: {
              id: true,
              name: true,
              durationMin: true,
              price: true,
            },
          },
          employee: {
            select: {
              id: true,
              displayName: true,
              specialties: {
                select: { specialty: true },
                orderBy: { specialty: 'asc' },
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
              discountAmount: true,
              payableAmount: true,
              appliedDiscountTier: true,
              currency: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { items, total };
  }

  async createForClient(
    user: { userId: string; role: UserRole },
    dto: CreateAppointmentDto,
  ) {
    if (user.role !== UserRole.CLIENT) {
      throw new BadRequestException('Only CLIENT can create appointments');
    }

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt');
    }

    this.assertStartInFuture(startAt);

    const service = await this.prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        salonId: dto.salonId,
        isActive: true,
      },
      select: {
        id: true,
        durationMin: true,
        price: true,
        category: true,
      },
    });

    if (!service) {
      throw new BadRequestException('Service not found for this salon');
    }

    const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

    if (dto.employeeId) {
      await this.resolveEmployeeForSlot(
        this.prisma,
        dto.salonId,
        startAt,
        endAt,
        [],
        service.category,
        dto.employeeId,
      );
    }

    const currency = 'XAF';

    const loyalty = await this.prisma.loyaltyAccount.findUnique({
      where: { userId: user.userId },
      select: {
        pendingDiscountAmount: true,
        pendingDiscountTier: true,
      },
    });

    const pendingDiscountAmount = loyalty?.pendingDiscountAmount ?? 0;
    const discountAmount = Math.min(
      service.price,
      Math.max(0, pendingDiscountAmount),
    );
    const payableAmount = Math.max(0, service.price - discountAmount);
    const appliedDiscountTier =
      discountAmount > 0 ? loyalty?.pendingDiscountTier ?? null : null;

    const platformFeePct = 10;
    const platformFeeAmount = Math.floor(
      (payableAmount * platformFeePct) / 100,
    );
    const providerFeeAmount = 0;
    const netAmount = Math.max(
      0,
      payableAmount - platformFeeAmount - providerFeeAmount,
    );

    const { appointment, paymentIntent } = await this.prisma.$transaction(
      async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            salonId: dto.salonId,
            serviceId: dto.serviceId,
            clientId: user.userId,
            employeeId: dto.employeeId ?? null,
            note: dto.note ?? null,
            startAt,
            endAt,
            status: AppointmentStatus.PENDING,
          },
          include: {
            salon: { select: { id: true, name: true } },
            service: {
              select: {
                id: true,
                name: true,
                durationMin: true,
                price: true,
              },
            },
            employee: {
              select: {
                id: true,
                displayName: true,
                specialties: {
                  select: { specialty: true },
                  orderBy: { specialty: 'asc' },
                },
              },
            },
          },
        });

        const paymentIntent = await tx.paymentIntent.create({
          data: {
            userId: user.userId,
            salonId: dto.salonId,
            appointmentId: appointment.id,
            amount: service.price,
            currency,
            status: PaymentStatus.CREATED,
            provider: null,
            providerRef: null,
            providerData: Prisma.DbNull,
            platformFeeAmount,
            providerFeeAmount,
            netAmount,
            discountAmount,
            payableAmount,
            appliedDiscountTier,
          },
        });

        return { appointment, paymentIntent };
      },
    );

    return { appointment, paymentIntent };
  }

  async createFromCart(
    user: { userId: string; role: UserRole },
    dto: CreateAppointmentsFromCartDto,
  ) {
    if (user.role !== UserRole.CLIENT) {
      throw new BadRequestException('Only CLIENT can create appointments');
    }

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt');
    }

    this.assertStartInFuture(startAt);

    const expandedServiceIds = dto.items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => item.serviceId),
    );

    const services = await this.prisma.service.findMany({
      where: {
        id: { in: Array.from(new Set(expandedServiceIds)) },
        salonId: dto.salonId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        durationMin: true,
        price: true,
        category: true,
      },
    });

    if (services.length === 0) {
      throw new BadRequestException('No valid services found for this salon');
    }

    const byId = new Map(services.map((service) => [service.id, service]));

    for (const serviceId of expandedServiceIds) {
      if (!byId.has(serviceId)) {
        throw new BadRequestException(
          `Service not found for this salon: ${serviceId}`,
        );
      }
    }

    const employees = await this.prisma.employee.findMany({
      where: { salonId: dto.salonId, isActive: true },
      select: {
        id: true,
        displayName: true,
        specialties: {
          select: { specialty: true },
          orderBy: { specialty: 'asc' },
        },
      },
    });

    if (employees.length === 0) {
      throw new BadRequestException(
        'No active employee available for this salon',
      );
    }

    if (
      dto.employeeId &&
      !employees.some((employee) => employee.id === dto.employeeId)
    ) {
      throw new BadRequestException('Employee not found for this salon');
    }

    const bookingGroupId = `cart-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const paymentMethod = dto.paymentMethod ?? 'CASH';
    const isInternalPaymentCaptured = paymentMethod !== 'CASH';

    const appointments = await this.prisma.$transaction(async (tx) => {
      const created: Prisma.AppointmentGetPayload<{
        include: {
          salon: { select: { id: true; name: true } };
          service: {
            select: {
              id: true;
              name: true;
              durationMin: true;
              price: true;
            };
          };
          employee: {
            select: {
              id: true;
              displayName: true;
              specialties: {
                select: { specialty: true };
              };
            };
          };
        };
      }>[] = [];

      let cursorStart = startAt;

      for (const serviceId of expandedServiceIds) {
        const service = byId.get(serviceId)!;
        const endAt = new Date(
          cursorStart.getTime() + service.durationMin * 60_000,
        );

        const assignedEmployeeId = await this.resolveEmployeeForSlot(
          tx,
          dto.salonId,
          cursorStart,
          endAt,
          [],
          service.category,
          dto.employeeId ?? null,
        );

        const noteWithGroup = dto.note
          ? `[BOOKING_GROUP:${bookingGroupId}] ${dto.note}`
          : `[BOOKING_GROUP:${bookingGroupId}]`;

        const appointment = await tx.appointment.create({
          data: {
            salonId: dto.salonId,
            serviceId,
            clientId: user.userId,
            employeeId: assignedEmployeeId,
            note: noteWithGroup,
            startAt: cursorStart,
            endAt,
            status: AppointmentStatus.PENDING,
          },
          include: {
            salon: { select: { id: true, name: true } },
            service: {
              select: {
                id: true,
                name: true,
                durationMin: true,
                price: true,
              },
            },
            employee: {
              select: {
                id: true,
                displayName: true,
                specialties: {
                  select: { specialty: true },
                  orderBy: { specialty: 'asc' },
                },
              },
            },
          },
        });

        await tx.paymentIntent.create({
          data: {
            userId: user.userId,
            salonId: dto.salonId,
            appointmentId: appointment.id,
            amount: service.price,
            discountAmount: 0,
            payableAmount: service.price,
            currency: 'XAF',
            status: isInternalPaymentCaptured
              ? PaymentStatus.SUCCEEDED
              : PaymentStatus.CREATED,
            provider: isInternalPaymentCaptured ? 'INTERNAL_BETA' : null,
            providerRef: isInternalPaymentCaptured
              ? `client-beta-${paymentMethod.toLowerCase()}-${appointment.id}`
              : null,
            providerData: isInternalPaymentCaptured
              ? {
                  source: 'client_beta',
                  paymentMethod,
                  bookingGroupId,
                }
              : Prisma.DbNull,
            platformFeeAmount: 0,
            providerFeeAmount: 0,
            netAmount: service.price,
          },
        });

        created.push(appointment);
        cursorStart = endAt;
      }

      return created;
    });

    return {
      bookingGroupId,
      items: appointments,
      total: appointments.length,
      totalDurationMin: appointments.reduce(
        (sum, appointment) => sum + appointment.service.durationMin,
        0,
      ),
      totalAmount: appointments.reduce(
        (sum, appointment) => sum + appointment.service.price,
        0,
      ),
      payment: {
        method: paymentMethod,
        status: isInternalPaymentCaptured
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.CREATED,
      },
    };
  }

  async assignEmployee(
    user: { userId: string; role: UserRole },
    appointmentId: string,
    dto: AssignEmployeeDto,
  ) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        salonId: true,
        clientId: true,
        employeeId: true,
        startAt: true,
        endAt: true,
        service: { select: { category: true } },
        salon: { select: { ownerId: true } },
      },
    });

    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }

    const isOwner =
      user.role === UserRole.PROFESSIONAL && appt.salon.ownerId === user.userId;
    const isAdmin = user.role === UserRole.ADMIN;
    const isClient = user.role === UserRole.CLIENT && appt.clientId === user.userId;

    if (!isOwner && !isAdmin && !isClient) {
      throw new ForbiddenException('Not allowed');
    }

    if (!dto.employeeId) {
      return this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { employeeId: null },
        include: {
          salon: { select: { id: true, name: true } },
          service: {
            select: {
              id: true,
              name: true,
              durationMin: true,
              price: true,
            },
          },
          employee: {
            select: {
              id: true,
              displayName: true,
              specialties: {
                select: { specialty: true },
                orderBy: { specialty: 'asc' },
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
              currency: true,
              createdAt: true,
            },
          },
        },
      });
    }

    const emp = await this.prisma.employee.findFirst({
      where: {
        id: dto.employeeId,
        salonId: appt.salonId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!emp) {
      throw new BadRequestException('Employee not found for this salon');
    }

    await this.resolveEmployeeForSlot(
      this.prisma,
      appt.salonId,
      appt.startAt,
      appt.endAt,
      [appt.id],
      appt.service.category,
      dto.employeeId,
    );

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { employeeId: dto.employeeId },
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
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
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
            currency: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async groupDetails(
    user: { userId: string; role: UserRole },
    groupId: string,
  ) {
    const appointments = await this.getManagedAppointments(user, groupId);
    const primary = appointments[0];
    const policy = this.getCancellationPolicy(primary.startAt);

    const employees = await this.prisma.employee.findMany({
      where: { salonId: primary.salonId, isActive: true },
      select: {
        id: true,
        displayName: true,
        specialties: {
          select: { specialty: true },
          orderBy: { specialty: 'asc' },
        },
      },
      orderBy: { displayName: 'asc' },
    });

    return {
      groupId,
      salon: primary.salon,
      canManage: this.canManageAppointment(primary.status, primary.startAt),
      cancellationPolicy: policy,
      items: appointments.map((appointment) => ({
        id: appointment.id,
        status: appointment.status,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        note: appointment.note,
        service: appointment.service,
        employee: appointment.employee,
        paymentIntent: appointment.paymentIntents[0] ?? null,
      })),
      employees: employees.map((employee) => this.mapEmployeeSummary(employee)),
    };
  }

  async updateGroup(
    user: { userId: string; role: UserRole },
    groupId: string,
    dto: UpdateAppointmentGroupDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointments = await this.getManagedAppointments(user, groupId, tx);
      const primary = appointments[0];

      if (
        !appointments.every((appointment) =>
          this.canManageAppointment(appointment.status, appointment.startAt),
        )
      ) {
        throw new BadRequestException(
          'Only pending or confirmed appointments can be modified',
        );
      }

      const startAt = dto.startAt
        ? new Date(dto.startAt)
        : appointments[0].startAt;

      if (Number.isNaN(startAt.getTime())) {
        throw new BadRequestException('Invalid startAt');
      }

      this.assertStartInFuture(startAt);
      this.assertStartMatchesSalonSchedulingSlots(startAt);

      const timeChanged =
        appointments[0].startAt.getTime() !== startAt.getTime();

      const targetEmployeeId =
        dto.employeeId === undefined ? undefined : dto.employeeId || null;

      if (targetEmployeeId) {
        const employee = await tx.employee.findFirst({
          where: {
            id: targetEmployeeId,
            salonId: primary.salonId,
            isActive: true,
          },
          select: { id: true },
        });

        if (!employee) {
          throw new BadRequestException('Employee not found for this salon');
        }
      }

      let cursor = new Date(startAt);

      for (const appointment of appointments) {
        const nextEnd = new Date(
          cursor.getTime() + appointment.service.durationMin * 60_000,
        );

        this.assertWithinSalonBusinessHours(cursor, nextEnd);

        const employeeId =
          targetEmployeeId === undefined
            ? appointment.employeeId
            : targetEmployeeId;

        const resolvedEmployeeId = await this.resolveEmployeeForSlot(
          tx,
          primary.salonId,
          cursor,
          nextEnd,
          appointments.map((item) => item.id),
          appointment.service.category,
          employeeId,
          targetEmployeeId === undefined && timeChanged,
        );

        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            startAt: cursor,
            endAt: nextEnd,
            employeeId: resolvedEmployeeId,
          },
        });

        cursor = nextEnd;
      }

      const refreshed = await this.getManagedAppointments(user, groupId, tx);

      return {
        groupId,
        cancellationPolicy: this.getCancellationPolicy(refreshed[0].startAt),
        items: refreshed.map((appointment) => ({
          id: appointment.id,
          status: appointment.status,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          note: appointment.note,
          service: appointment.service,
          employee: appointment.employee,
          paymentIntent: appointment.paymentIntents[0] ?? null,
        })),
      };
    });
  }

  async cancelGroup(
    user: { userId: string; role: UserRole },
    groupId: string,
    dto: { reason?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointments = await this.getManagedAppointments(user, groupId, tx);

      const cancellable = appointments.filter((appointment) =>
        this.canManageAppointment(appointment.status, appointment.startAt),
      );

      if (!cancellable.length) {
        throw new BadRequestException('No cancellable appointment found');
      }

      const policy = this.getCancellationPolicy(cancellable[0].startAt);
      const refundedAppointmentIds: string[] = [];

      for (const appointment of cancellable) {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: AppointmentStatus.CANCELLED },
        });

        const paymentIntent = appointment.paymentIntents[0];

        if (
          paymentIntent &&
          paymentIntent.status === PaymentStatus.SUCCEEDED &&
          policy.refundRate > 0
        ) {
          await tx.paymentIntent.update({
            where: { id: paymentIntent.id },
            data: { status: PaymentStatus.REFUNDED },
          });

          refundedAppointmentIds.push(appointment.id);

          await this.rollbackLoyaltyAfterRefund(
            tx,
            appointment.clientId,
            appointment.id,
            paymentIntent,
            dto.reason,
          );
        }
      }

      return {
        groupId,
        cancelledCount: cancellable.length,
        refundedAppointmentIds,
        cancellationPolicy: policy,
      };
    });
  }

  async createGroupReview(
    user: { userId: string; role: UserRole },
    groupId: string,
    dto: CreateReviewDto,
  ) {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create reviews');
    }

    const appointments = await this.getManagedAppointments(user, groupId);
    const primary = appointments[0];

    const hasCompletedAppointment = appointments.some(
      (appointment) =>
        appointment.status === AppointmentStatus.COMPLETED &&
        appointment.startAt.getTime() <= Date.now(),
    );

    const comment = dto.comment.trim();

    if (!hasCompletedAppointment) {
      throw new BadRequestException('Only completed appointments can be reviewed');
    }

    if (!comment) {
      throw new BadRequestException('Comment is required');
    }

    const review = await this.prisma.salonReview.create({
      data: {
        salonId: primary.salonId,
        clientId: user.userId,
        rating: dto.rating,
        comment,
      },
    });

    return { review };
  }

  async cancel(
    user: { userId: string; role: UserRole },
    appointmentId: string,
    dto: { reason?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          status: true,
          clientId: true,
          salonId: true,
          salon: { select: { ownerId: true } },
        },
      });

      if (!appt) {
        throw new NotFoundException('Appointment not found');
      }

      const isOwner =
        user.role === UserRole.PROFESSIONAL &&
        appt.salon.ownerId === user.userId;
      const isAdmin = user.role === UserRole.ADMIN;
      const isClient =
        user.role === UserRole.CLIENT && appt.clientId === user.userId;
      const isEmployee = user.role === UserRole.EMPLOYEE;

      if (!isOwner && !isAdmin && !isClient && !isEmployee) {
        throw new ForbiddenException('Not allowed');
      }

      const cancelled = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });

      const lastIntent = await tx.paymentIntent.findFirst({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          amount: true,
          payableAmount: true,
          discountAmount: true,
          appliedDiscountTier: true,
        },
      });

      if (lastIntent && lastIntent.status === PaymentStatus.SUCCEEDED) {
        const canRefund =
          user.role === UserRole.PROFESSIONAL || user.role === UserRole.ADMIN;

        if (!canRefund) {
          return {
            appointment: cancelled,
            refundRequired: true,
            paymentIntentIdToRefund: lastIntent.id,
          };
        }

        await tx.paymentIntent.update({
          where: { id: lastIntent.id },
          data: { status: PaymentStatus.REFUNDED },
        });

        await this.rollbackLoyaltyAfterRefund(
          tx,
          appt.clientId,
          appointmentId,
          lastIntent,
          dto.reason,
        );
      }

      return { appointment: cancelled };
    });
  }

  async getProCalendar(
    user: { userId: string; role: UserRole },
    date?: string,
  ) {
    if (user.role !== UserRole.PROFESSIONAL && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed');
    }

    const salonIds = await this.getManagedSalonIds(user);

    if (!salonIds.length) {
      return [];
    }

    const targetDate = date ? new Date(date) : new Date();

    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId: { in: salonIds },
        startAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            clientProfile: {
              select: { nickname: true },
            },
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            durationMin: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      status: appointment.status,
      clientName:
        appointment.client.clientProfile?.nickname ||
        appointment.client.email ||
        appointment.client.phone ||
        'Client',
      clientPhone: appointment.client.phone ?? null,
      serviceName: appointment.service.name,
      employeeName: appointment.employee?.displayName ?? null,
      employee: appointment.employee
        ? this.mapEmployeeSummary(appointment.employee)
        : null,
    }));
  }

  async getProPendingRequests(
    user: { userId: string; role: UserRole },
    date?: string,
  ) {
    if (user.role !== UserRole.PROFESSIONAL && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed');
    }

    const salonIds = await this.getManagedSalonIds(user);

    if (!salonIds.length) {
      return [];
    }

    const where: Prisma.AppointmentWhereInput = {
      salonId: { in: salonIds },
      status: AppointmentStatus.PENDING,
    };

    if (date) {
      const targetDate = new Date(date);

      if (Number.isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date');
      }

      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);

      where.startAt = {
        gte: start,
        lte: end,
      };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            clientProfile: {
              select: { nickname: true },
            },
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            durationMin: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      status: appointment.status,
      clientName:
        appointment.client.clientProfile?.nickname ||
        appointment.client.email ||
        appointment.client.phone ||
        'Client',
      clientPhone: appointment.client.phone ?? null,
      serviceName: appointment.service.name,
      employeeName: appointment.employee?.displayName ?? null,
      employee: appointment.employee
        ? this.mapEmployeeSummary(appointment.employee)
        : null,
    }));
  }

  async getProHistory(
    user: { userId: string; role: UserRole },
    status?: string,
  ) {
    if (user.role !== UserRole.PROFESSIONAL && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed');
    }

    const salonIds = await this.getManagedSalonIds(user);

    if (!salonIds.length) {
      return [];
    }

    const allowedStatuses: AppointmentStatus[] = [
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ];

    const where: Prisma.AppointmentWhereInput = {
      salonId: { in: salonIds },
      status: {
        in: allowedStatuses,
      },
    };

    if (
      status &&
      ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status.toUpperCase())
    ) {
      where.status = status.toUpperCase() as AppointmentStatus;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            clientProfile: {
              select: { nickname: true },
            },
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: { startAt: 'desc' },
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      clientId: appointment.client.id,
      clientName:
        appointment.client.clientProfile?.nickname ||
        appointment.client.email ||
        appointment.client.phone ||
        'Client',
      clientPhone: appointment.client.phone ?? null,
      servicesLabel: appointment.service.name,
      employeeName: appointment.employee?.displayName ?? null,
      employee: appointment.employee
        ? this.mapEmployeeSummary(appointment.employee)
        : null,
      amount:
        appointment.totalAmount > 0
          ? appointment.totalAmount
          : appointment.service.price,
      status: appointment.status,
    }));
  }

  async exportProHistory(
    user: { userId: string; role: UserRole },
    status: string | undefined,
    res: Response,
  ) {
    let normalizedStatus: string | undefined;

    if (status === 'completed') normalizedStatus = 'COMPLETED';
    else if (status === 'cancelled') normalizedStatus = 'CANCELLED';
    else if (status === 'no-show') normalizedStatus = 'NO_SHOW';
    else if (
      status === 'COMPLETED' ||
      status === 'CANCELLED' ||
      status === 'NO_SHOW'
    ) {
      normalizedStatus = status;
    }

    const items = await this.getProHistory(user, normalizedStatus);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historique réservations');

    worksheet.columns = [
      { header: 'ID réservation', key: 'id', width: 26 },
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Client', key: 'clientName', width: 24 },
      { header: 'Téléphone', key: 'clientPhone', width: 18 },
      { header: 'Services', key: 'servicesLabel', width: 28 },
      { header: 'Employé', key: 'employeeName', width: 24 },
      { header: 'Montant', key: 'amount', width: 14 },
      { header: 'Statut', key: 'status', width: 14 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    for (const item of items) {
      worksheet.addRow({
        id: item.id,
        date: new Date(item.startAt).toLocaleString('fr-FR'),
        clientName: item.clientName,
        clientPhone: item.clientPhone ?? 'Non renseigné',
        servicesLabel: item.servicesLabel,
        employeeName: item.employeeName ?? 'Non assigné',
        amount: item.amount,
        status:
          item.status === AppointmentStatus.COMPLETED
            ? 'Terminé'
            : item.status === AppointmentStatus.CANCELLED
              ? 'Annulé'
              : item.status === AppointmentStatus.NO_SHOW
                ? 'No-show'
                : item.status,
      });
    }

    worksheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle' };

      if (rowNumber > 1) {
        row.getCell(7).numFmt = '#,##0 "FCFA"';
      }
    });

    const safeStatus = normalizedStatus ? normalizedStatus.toLowerCase() : 'all';
    const filename = `booking-history-${safeStatus}-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  async confirmAppointment(
    user: { userId: string; role: UserRole },
    appointmentId: string,
  ) {
    if (user.role !== UserRole.PROFESSIONAL && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed');
    }

    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        salon: { select: { ownerId: true } },
      },
    });

    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }

    const isOwner =
      user.role === UserRole.PROFESSIONAL && appt.salon.ownerId === user.userId;

    if (!isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed');
    }

    if (appt.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Only pending appointments can be confirmed');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CONFIRMED },
    });
  }

  async rejectAppointment(
    user: { userId: string; role: UserRole },
    appointmentId: string,
  ) {
    if (user.role !== UserRole.PROFESSIONAL && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed');
    }

    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        salon: { select: { ownerId: true } },
      },
    });

    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }

    const isOwner =
      user.role === UserRole.PROFESSIONAL && appt.salon.ownerId === user.userId;

    if (!isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed');
    }

    if (appt.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Only pending appointments can be rejected');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }

  private async getManagedAppointments(
    user: { userId: string; role: UserRole },
    groupId: string,
    prisma: DbClient = this.prisma,
  ) {
    const direct = await prisma.appointment.findMany({
      where: this.buildManagedAppointmentWhere(user, {
        id: groupId,
      }),
      orderBy: { startAt: 'asc' },
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
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
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
            discountAmount: true,
            appliedDiscountTier: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });

    if (direct.length > 0) {
      return direct;
    }

    const grouped = await prisma.appointment.findMany({
      where: this.buildManagedAppointmentWhere(user, {
        note: { contains: `[BOOKING_GROUP:${groupId}]` },
      }),
      orderBy: { startAt: 'asc' },
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
        employee: {
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
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
            discountAmount: true,
            appliedDiscountTier: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });

    if (!grouped.length) {
      throw new NotFoundException('Appointment not found');
    }

    return grouped;
  }

  private buildManagedAppointmentWhere(
    user: { userId: string; role: UserRole },
    extra: Prisma.AppointmentWhereInput,
  ): Prisma.AppointmentWhereInput {
    if (user.role === UserRole.CLIENT) {
      return { ...extra, clientId: user.userId };
    }

    if (user.role === UserRole.ADMIN) {
      return extra;
    }

    if (user.role === UserRole.PROFESSIONAL) {
      return {
        ...extra,
        salon: {
          ownerId: user.userId,
        },
      };
    }

    if (user.role === UserRole.EMPLOYEE) {
      return {
        ...extra,
        employee: {
          userId: user.userId,
        },
      };
    }

    throw new ForbiddenException('Not allowed');
  }

  private canManageAppointment(status: AppointmentStatus, startAt: Date) {
    if (startAt.getTime() <= Date.now()) {
      return false;
    }

    return (
      status === AppointmentStatus.PENDING ||
      status === AppointmentStatus.CONFIRMED
    );
  }

  private assertStartInFuture(startAt: Date) {
    if (startAt.getTime() <= Date.now()) {
      throw new BadRequestException('Selected time must be in the future');
    }
  }

  private getCancellationPolicy(startAt: Date) {
    const noticeHours = Math.max(
      0,
      Math.floor((startAt.getTime() - Date.now()) / 3_600_000),
    );

    const isRefundEligible = noticeHours >= CLIENT_CANCELLATION_NOTICE_HOURS;

    return {
      source: 'default',
      noticeHoursRequired: CLIENT_CANCELLATION_NOTICE_HOURS,
      noticeHoursRemaining: noticeHours,
      refundRate: isRefundEligible ? 1 : 0,
      refundLabel: isRefundEligible
        ? 'Remboursement complet'
        : 'Annulation sans remboursement',
    };
  }

  private assertWithinSalonBusinessHours(startAt: Date, endAt: Date) {
    const sameDay = startAt.toISOString().slice(0, 10);
    const dayStart = new Date(`${sameDay}T08:00:00.000Z`);
    const dayEnd = new Date(`${sameDay}T18:00:00.000Z`);

    if (startAt < dayStart || endAt > dayEnd) {
      throw new BadRequestException(
        'Selected time is outside salon opening hours',
      );
    }
  }

  private assertStartMatchesSalonSchedulingSlots(startAt: Date) {
    if (![0, 30].includes(startAt.getUTCMinutes())) {
      throw new BadRequestException(
        'Selected time must match the salon scheduling slots',
      );
    }
  }

  private async resolveEmployeeForSlot(
    prisma: DbClient,
    salonId: string,
    startAt: Date,
    endAt: Date,
    excludedAppointmentIds: string[],
    serviceCategory: ServiceCategory,
    requestedEmployeeId?: string | null,
    allowFallbackToAnyAvailable = false,
  ) {
    if (requestedEmployeeId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: requestedEmployeeId,
          salonId,
          isActive: true,
        },
        select: {
          id: true,
          specialties: {
            select: { specialty: true },
            orderBy: { specialty: 'asc' },
          },
        },
      });

      if (!employee) {
        throw new BadRequestException('Employee not found for this salon');
      }

      if (!employeeCanPerformCategory(employee.specialties, serviceCategory)) {
        if (!allowFallbackToAnyAvailable) {
          throw new BadRequestException(
            'Selected employee cannot perform this service',
          );
        }
      } else {
        const hasConflict = await this.hasEmployeeSchedulingConflict(
          prisma,
          salonId,
          requestedEmployeeId,
          startAt,
          endAt,
          { excludeAppointmentIds: excludedAppointmentIds },
        );

        if (!hasConflict) {
          return requestedEmployeeId;
        }

        if (!allowFallbackToAnyAvailable) {
          throw new BadRequestException(
            'Selected employee is not available at this time',
          );
        }
      }
    }

    const employees = await prisma.employee.findMany({
      where: {
        salonId,
        isActive: true,
      },
      select: {
        id: true,
        specialties: {
          select: { specialty: true },
          orderBy: { specialty: 'asc' },
        },
      },
      orderBy: { displayName: 'asc' },
    });

    for (const employee of employees) {
      if (!employeeCanPerformCategory(employee.specialties, serviceCategory)) {
        continue;
      }

      const hasConflict = await this.hasEmployeeSchedulingConflict(
        prisma,
        salonId,
        employee.id,
        startAt,
        endAt,
        { excludeAppointmentIds: excludedAppointmentIds },
      );

      if (!hasConflict) {
        return employee.id;
      }
    }

    if (requestedEmployeeId) {
      throw new BadRequestException(
        'Selected employee is not available at this time',
      );
    }

    throw new BadRequestException('No employee available at the selected time');
  }

  private async hasEmployeeSchedulingConflict(
    prisma: DbClient,
    salonId: string,
    employeeId: string,
    startAt: Date,
    endAt: Date,
    options?: {
      excludeAppointmentIds?: string[];
      excludeBlockedSlotId?: string;
    },
  ) {
    const anyPrisma = prisma as any;

    const appointmentConflict = await prisma.appointment.findFirst({
      where: {
        salonId,
        employeeId,
        id: options?.excludeAppointmentIds?.length
          ? { notIn: options.excludeAppointmentIds }
          : undefined,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });

    const blockedSlotConflict = anyPrisma.employeeBlockedSlot
      ? await anyPrisma.employeeBlockedSlot.findFirst({
          where: {
            salonId,
            employeeId,
            id: options?.excludeBlockedSlotId
              ? { not: options.excludeBlockedSlotId }
              : undefined,
            status: {
              in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
            },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
          select: { id: true },
        })
      : null;

    const leaveDelegate =
      anyPrisma.employeeLeaveRequest ?? anyPrisma.leaveRequest ?? null;

    const leaveConflict = leaveDelegate
      ? await leaveDelegate.findFirst({
          where: {
            employeeId,
            status: 'APPROVED',
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
          select: { id: true },
        })
      : null;

    return Boolean(appointmentConflict || blockedSlotConflict || leaveConflict);
  }

  private mapEmployeeSummary(employee: {
    id: string;
    displayName: string;
    specialties: Array<{ specialty: any }>;
  }) {
    return {
      id: employee.id,
      displayName: employee.displayName,
      specialties: getEmployeeSpecialtyLabels(employee.specialties),
      primarySpecialtyLabel: getPrimaryEmployeeSpecialtyLabel(
        employee.specialties,
      ),
    };
  }

  private async rollbackLoyaltyAfterRefund(
    prisma: DbClient,
    clientId: string,
    appointmentId: string,
    paymentIntent: {
      id: string;
      amount: number;
      payableAmount: number | null;
      discountAmount: number;
      appliedDiscountTier: LoyaltyTier | null;
    },
    reason?: string,
  ) {
    const payable =
      paymentIntent.payableAmount && paymentIntent.payableAmount > 0
        ? paymentIntent.payableAmount
        : paymentIntent.amount;

    const earnedPoints = Math.floor(payable / 100);

    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: clientId },
      select: {
        id: true,
        currentPoints: true,
        lifetimePoints: true,
      },
    });

    if (loyalty && earnedPoints > 0) {
      await prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: loyalty.id,
          deltaPoints: -earnedPoints,
          reason: LoyaltyReason.ADJUSTMENT,
          meta: {
            appointmentId,
            refundPaymentIntentId: paymentIntent.id,
            reason: reason ?? null,
          },
        },
      });

      const newCurrent = Math.max(0, loyalty.currentPoints - earnedPoints);
      const newLifetime = Math.max(0, loyalty.lifetimePoints - earnedPoints);

      const tierFromPoints = (pts: number): LoyaltyTier => {
        if (pts >= 5000) return LoyaltyTier.PLATINUM;
        if (pts >= 2000) return LoyaltyTier.GOLD;
        if (pts >= 500) return LoyaltyTier.SILVER;
        return LoyaltyTier.BRONZE;
      };

      await prisma.loyaltyAccount.update({
        where: { userId: clientId },
        data: {
          currentPoints: newCurrent,
          lifetimePoints: newLifetime,
          tier: tierFromPoints(newLifetime),
        },
      });
    }

    if ((paymentIntent.discountAmount ?? 0) > 0) {
      const account = await prisma.loyaltyAccount.findUnique({
        where: { userId: clientId },
        select: { pendingDiscountAmount: true },
      });

      if ((account?.pendingDiscountAmount ?? 0) === 0) {
        await prisma.loyaltyAccount.update({
          where: { userId: clientId },
          data: {
            pendingDiscountAmount: paymentIntent.discountAmount,
            pendingDiscountTier: paymentIntent.appliedDiscountTier ?? null,
            pendingDiscountIssuedAt: new Date(),
            pendingDiscountConsumedAt: null,
            pendingDiscountConsumedIntentId: null,
          },
        });
      }
    }
  }

  private async getManagedSalonIds(user: { userId: string; role: UserRole }) {
    if (user.role === UserRole.ADMIN) {
      const salons = await this.prisma.salon.findMany({
        select: { id: true },
      });

      return salons.map((salon) => salon.id);
    }

    if (user.role === UserRole.PROFESSIONAL) {
      const salons = await this.prisma.salon.findMany({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      return salons.map((salon) => salon.id);
    }

    throw new ForbiddenException('Not allowed');
  }
}