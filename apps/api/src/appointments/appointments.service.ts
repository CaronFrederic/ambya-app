import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AssignEmployeeDto } from './dto/assign-employee.dto';
import { CreateAppointmentsFromCartDto } from './dto/create-appointments-from-cart.dto';
import { UpdateAppointmentGroupDto } from './dto/update-appointment-group.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  LoyaltyReason,
  LoyaltyTier,
  AppointmentStatus,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

const CLIENT_CANCELLATION_NOTICE_HOURS = 24;

type TxClient = Prisma.TransactionClient;
type DbClient = PrismaService | TxClient;

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(
    user: { userId: string; role: UserRole },
    q: ListAppointmentsDto,
  ) {
    const where: any = {};

    if (user.role === 'CLIENT') {
      where.clientId = user.userId;
    }

    if (user.role === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (!employee) throw new ForbiddenException();
      where.employeeId = employee.id;
    }

    if (user.role === 'PROFESSIONAL') {
      const salons = await this.prisma.salon.findMany({
        where: { ownerId: user.userId },
        select: { id: true },
      });
      where.salonId = { in: salons.map((s) => s.id) };
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
            select: { id: true, name: true, durationMin: true, price: true },
          },
          employee: { select: { id: true, displayName: true } },
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
    if (user.role !== 'CLIENT') {
      throw new BadRequestException('Only CLIENT can create appointments');
    }

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, salonId: dto.salonId, isActive: true },
      select: { id: true, durationMin: true, price: true },
    });
    if (!service) {
      throw new BadRequestException('Service not found for this salon');
    }

    if (dto.employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: dto.employeeId, salonId: dto.salonId, isActive: true },
        select: { id: true },
      });
      if (!emp)
        throw new BadRequestException('Employee not found for this salon');
    }

    const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

    // ---- PaymentIntent (beta) with fixed discount ----
    const currency = 'XAF';

    const loyalty = await this.prisma.loyaltyAccount.findUnique({
      where: { userId: user.userId },
      select: { pendingDiscountAmount: true, pendingDiscountTier: true },
    });

    const pendingDiscountAmount = loyalty?.pendingDiscountAmount ?? 0;
    const discountAmount = Math.min(
      service.price,
      Math.max(0, pendingDiscountAmount),
    );
    const payableAmount = Math.max(0, service.price - discountAmount);
    const appliedDiscountTier =
      discountAmount > 0 ? (loyalty?.pendingDiscountTier ?? null) : null;

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
              select: { id: true, name: true, durationMin: true, price: true },
            },
            employee: { select: { id: true, displayName: true } },
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
            providerData: undefined,

            platformFeeAmount,
            providerFeeAmount,
            netAmount,

            // ✅ fixed discount applied (but NOT consumed yet)
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
  if (user.role !== 'CLIENT') {
    throw new BadRequestException('Only CLIENT can create appointments');
  }

  const startAt = new Date(dto.startAt);
  if (Number.isNaN(startAt.getTime())) {
    throw new BadRequestException('Invalid startAt');
  }

  const expandedServiceIds = dto.items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => item.serviceId),
  );

  const services = await this.prisma.service.findMany({
    where: {
      id: { in: Array.from(new Set(expandedServiceIds)) },
      salonId: dto.salonId,
      isActive: true,
    },
    select: { id: true, name: true, durationMin: true, price: true },
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
    select: { id: true, displayName: true },
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

  const appointments = await this.prisma.$transaction(async (tx) => {
    const created: Prisma.AppointmentGetPayload<{
      include: {
        salon: { select: { id: true; name: true } };
        service: { select: { id: true; name: true; durationMin: true; price: true } };
        employee: { select: { id: true; displayName: true } };
      };
    }>[] = [];

    let cursorStart = startAt;

    for (const serviceId of expandedServiceIds) {
      const service = byId.get(serviceId)!;

      const endAt = new Date(
        cursorStart.getTime() + service.durationMin * 60_000,
      );

      const overlaps = await tx.appointment.findMany({
        where: {
          salonId: dto.salonId,
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
          startAt: { lt: endAt },
          endAt: { gt: cursorStart },
        },
        select: { employeeId: true },
      });

      const busyEmployeeIds = new Set(
        overlaps
          .map((appointment) => appointment.employeeId)
          .filter((employeeId): employeeId is string => Boolean(employeeId)),
      );

      let assignedEmployeeId: string;

      if (dto.employeeId) {
        if (busyEmployeeIds.has(dto.employeeId)) {
          throw new BadRequestException(
            'Selected employee is not available at this time',
          );
        }

        assignedEmployeeId = dto.employeeId;
      } else {
        const availableEmployee = employees.find(
          (employee) => !busyEmployeeIds.has(employee.id),
        );

        if (!availableEmployee) {
          throw new BadRequestException(
            'No employee available at the selected time',
          );
        }

        assignedEmployeeId = availableEmployee.id;
      }

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
            select: { id: true, name: true, durationMin: true, price: true },
          },
          employee: { select: { id: true, displayName: true } },
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
          status: PaymentStatus.CREATED,
          provider: null,
          providerRef: null,
          providerData: undefined,
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
  };
}

  async assignEmployee(
    user: { userId: string; role: UserRole },
    appointmentId: string,
    dto: AssignEmployeeDto,
  ) {
    // On récupère le RDV + salon ownerId pour check permissions
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        salonId: true,
        clientId: true,
        employeeId: true,
        salon: { select: { ownerId: true } },
      },
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    const isOwner =
      user.role === 'PROFESSIONAL' && appt.salon.ownerId === user.userId;
    const isAdmin = user.role === 'ADMIN';
    const isClient = user.role === 'CLIENT' && appt.clientId === user.userId;

    // MVP: autorise PRO owner + ADMIN (et optionnellement CLIENT si tu veux)
    if (!isOwner && !isAdmin && !isClient) {
      throw new ForbiddenException('Not allowed');
    }

    // Unassign
    if (!dto.employeeId) {
      return this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { employeeId: null },
        include: {
          salon: { select: { id: true, name: true } },
          service: {
            select: { id: true, name: true, durationMin: true, price: true },
          },
          employee: { select: { id: true, displayName: true } },
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

    // Vérifie que l’employé existe et appartient au salon
    const emp = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, salonId: appt.salonId, isActive: true },
      select: { id: true },
    });
    if (!emp)
      throw new BadRequestException('Employee not found for this salon');

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { employeeId: dto.employeeId },
      include: {
        salon: { select: { id: true, name: true } },
        service: {
          select: { id: true, name: true, durationMin: true, price: true },
        },
        employee: { select: { id: true, displayName: true } },
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
      select: { id: true, displayName: true },
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
      employees,
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
        throw new BadRequestException('Only pending or confirmed appointments can be modified');
      }

      const startAt = dto.startAt ? new Date(dto.startAt) : appointments[0].startAt;
      if (Number.isNaN(startAt.getTime())) {
        throw new BadRequestException('Invalid startAt');
      }
      const timeChanged = appointments[0].startAt.getTime() !== startAt.getTime();

      const targetEmployeeId =
        dto.employeeId === undefined ? undefined : dto.employeeId || null;

      if (targetEmployeeId) {
        const employee = await tx.employee.findFirst({
          where: { id: targetEmployeeId, salonId: primary.salonId, isActive: true },
          select: { id: true },
        });
        if (!employee) {
          throw new BadRequestException('Employee not found for this salon');
        }
      }

      this.assertStartMatchesSalonSchedulingSlots(startAt);

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
    if (user.role !== 'CLIENT') {
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
      if (!appt) throw new NotFoundException('Appointment not found');

      const isOwner =
        user.role === 'PROFESSIONAL' && appt.salon.ownerId === user.userId;
      const isAdmin = user.role === 'ADMIN';
      const isClient = user.role === 'CLIENT' && appt.clientId === user.userId;
      const isEmployee = user.role === 'EMPLOYEE'; // optionnel

      if (!isOwner && !isAdmin && !isClient && !isEmployee) {
        throw new ForbiddenException('Not allowed');
      }

      // Cancel appointment
      const cancelled = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });

      // get last intent
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

      // If paid, refund + rollback loyalty
      if (lastIntent && lastIntent.status === PaymentStatus.SUCCEEDED) {
        const canRefund = user.role === 'PROFESSIONAL' || user.role === 'ADMIN';

        // ✅ EMPLOYEE / CLIENT : annulation OK mais refund doit être fait par PRO/ADMIN
        if (!canRefund) {
          return {
            appointment: cancelled,
            refundRequired: true,
            paymentIntentIdToRefund: lastIntent.id,
          };
        }

        // ✅ PRO/ADMIN : refund + rollback loyalty
        await tx.paymentIntent.update({
          where: { id: lastIntent.id },
          data: { status: PaymentStatus.REFUNDED },
        });

        const payable =
          lastIntent.payableAmount && lastIntent.payableAmount > 0
            ? lastIntent.payableAmount
            : lastIntent.amount;

        const earnedPoints = Math.floor(payable / 100);

        const loyalty = await tx.loyaltyAccount.findUnique({
          where: { userId: appt.clientId },
          select: { id: true, currentPoints: true, lifetimePoints: true },
        });

        if (loyalty && earnedPoints > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: loyalty.id,
              deltaPoints: -earnedPoints,
              reason: LoyaltyReason.ADJUSTMENT,
              meta: {
                appointmentId,
                refundPaymentIntentId: lastIntent.id,
                reason: dto.reason ?? null,
              },
            },
          });

          const newCurrent = Math.max(0, loyalty.currentPoints - earnedPoints);
          const newLifetime = Math.max(
            0,
            loyalty.lifetimePoints - earnedPoints,
          );

          const tierFromPoints = (pts: number): LoyaltyTier => {
            if (pts >= 5000) return 'PLATINUM';
            if (pts >= 2000) return 'GOLD';
            if (pts >= 500) return 'SILVER';
            return 'BRONZE';
          };

          await tx.loyaltyAccount.update({
            where: { userId: appt.clientId },
            data: {
              currentPoints: newCurrent,
              lifetimePoints: newLifetime,
              tier: tierFromPoints(newLifetime),
            },
          });
        }

        // (Option bêta) restore discount if it was used on this intent
        if ((lastIntent.discountAmount ?? 0) > 0) {
          const acc = await tx.loyaltyAccount.findUnique({
            where: { userId: appt.clientId },
            select: { pendingDiscountAmount: true },
          });

          if ((acc?.pendingDiscountAmount ?? 0) === 0) {
            await tx.loyaltyAccount.update({
              where: { userId: appt.clientId },
              data: {
                pendingDiscountAmount: lastIntent.discountAmount,
                pendingDiscountTier: lastIntent.appliedDiscountTier ?? null,
                pendingDiscountIssuedAt: new Date(),
                pendingDiscountConsumedAt: null,
                pendingDiscountConsumedIntentId: null,
              },
            });
          }
        }
      }

      return { appointment: cancelled };
    });
  }

  private async getManagedAppointments(
  user: { userId: string; role: UserRole },
  groupId: string,
  prisma: DbClient = this.prisma,
){
    const direct = await prisma.appointment.findMany({
      where: this.buildManagedAppointmentWhere(user, {
        id: groupId,
      }),
      orderBy: { startAt: 'asc' },
      include: {
        salon: { select: { id: true, name: true } },
        service: {
          select: { id: true, name: true, durationMin: true, price: true },
        },
        employee: { select: { id: true, displayName: true } },
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
          select: { id: true, name: true, durationMin: true, price: true },
        },
        employee: { select: { id: true, displayName: true } },
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
    if (user.role === 'CLIENT') {
      return { ...extra, clientId: user.userId };
    }

    if (user.role === 'ADMIN') {
      return extra;
    }

    if (user.role === 'PROFESSIONAL') {
      return {
        ...extra,
        salon: {
          ownerId: user.userId,
        },
      };
    }

    if (user.role === 'EMPLOYEE') {
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
  prisma: Prisma.TransactionClient,
  salonId: string,
  startAt: Date,
  endAt: Date,
  excludedAppointmentIds: string[],
  requestedEmployeeId?: string | null,
  allowFallbackToAnyAvailable = false,
){
    if (requestedEmployeeId) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          salonId,
          employeeId: requestedEmployeeId,
          id: { notIn: excludedAppointmentIds },
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { id: true },
      });

      if (conflict) {
        if (allowFallbackToAnyAvailable) {
          // Keep the booking modifiable when the chosen time is valid for the salon
          // but the original employee is no longer free.
        } else {
          throw new BadRequestException(
            'Selected employee is not available at this time',
          );
        }
      } else {
        return requestedEmployeeId;
      }
    }

    const employees = await prisma.employee.findMany({
      where: { salonId, isActive: true },
      select: { id: true },
      orderBy: { displayName: 'asc' },
    });

    for (const employee of employees) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          salonId,
          employeeId: employee.id,
          id: { notIn: excludedAppointmentIds },
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { id: true },
      });

      if (!conflict) {
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
      select: { id: true, currentPoints: true, lifetimePoints: true },
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
        if (pts >= 5000) return 'PLATINUM';
        if (pts >= 2000) return 'GOLD';
        if (pts >= 500) return 'SILVER';
        return 'BRONZE';
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


  async getProCalendar(
    user: { userId: string; role: UserRole },
    date?: string,
  ) {
    if (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    const salonIds =
      user.role === 'ADMIN'
        ? (
            await this.prisma.salon.findMany({
              select: { id: true },
            })
          ).map((salon) => salon.id)
        : (
            await this.prisma.salon.findMany({
              where: { ownerId: user.userId },
              select: { id: true },
            })
          ).map((salon) => salon.id);

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
              select: {
                nickname: true,
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
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
      time: appointment.startAt,
      staff: appointment.employee?.displayName ?? 'Non assigné',
      client:
        appointment.client.clientProfile?.nickname ||
        appointment.client.email ||
        appointment.client.phone ||
        'Client',
      service: appointment.service.name,
      duration: `${appointment.service.durationMin}min`,
      status: appointment.status,
    }));
  }

  async getProPendingRequests(
    user: { userId: string; role: UserRole },
    date?: string,
  ) {
    if (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    const salonIds =
      user.role === 'ADMIN'
        ? (
            await this.prisma.salon.findMany({
              select: { id: true },
            })
          ).map((salon) => salon.id)
        : (
            await this.prisma.salon.findMany({
              where: { ownerId: user.userId },
              select: { id: true },
            })
          ).map((salon) => salon.id);

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
              select: {
                nickname: true,
              },
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
      time: appointment.startAt,
      client:
        appointment.client.clientProfile?.nickname ||
        appointment.client.email ||
        appointment.client.phone ||
        'Client',
      service: appointment.service.name,
      duration: `${appointment.service.durationMin}min`,
      phone: appointment.client.phone ?? null,
    }));
  }

  async getProHistory(
    user: { userId: string; role: UserRole },
    status?: string,
  ) {
    if (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    const salonIds =
      user.role === 'ADMIN'
        ? (
            await this.prisma.salon.findMany({
              select: { id: true },
            })
          ).map((salon) => salon.id)
        : (
            await this.prisma.salon.findMany({
              where: { ownerId: user.userId },
              select: { id: true },
            })
          ).map((salon) => salon.id);

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
              select: {
                nickname: true,
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
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
      amount: appointment.totalAmount > 0 ? appointment.totalAmount : appointment.service.price,
      status: appointment.status,
    }));
  }

  async confirmAppointment(
  user: { userId: string; role: UserRole },
  appointmentId: string,
) {
  if (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN') {
    throw new ForbiddenException('Not allowed');
  }

  const appt = await this.prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      salon: { select: { ownerId: true } },
    },
  });

  if (!appt) throw new NotFoundException('Appointment not found');

  const isOwner =
    user.role === 'PROFESSIONAL' && appt.salon.ownerId === user.userId;

  if (!isOwner && user.role !== 'ADMIN') {
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
  if (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN') {
    throw new ForbiddenException('Not allowed');
  }

  const appt = await this.prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      salon: { select: { ownerId: true } },
    },
  });

  if (!appt) throw new NotFoundException('Appointment not found');

  const isOwner =
    user.role === 'PROFESSIONAL' && appt.salon.ownerId === user.userId;

  if (!isOwner && user.role !== 'ADMIN') {
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


}
