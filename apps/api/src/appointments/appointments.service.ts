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
import {
  LoyaltyReason,
  LoyaltyTier,
  AppointmentStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';

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
            providerData: Prisma.DbNull,

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

    const bookingGroupId = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const appointments = await this.prisma.$transaction(async (tx) => {
      const created: any[] = [];
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

        let assignedEmployeeId: string | null = null;

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
            providerData: Prisma.DbNull,
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
}
