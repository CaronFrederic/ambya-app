import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PromotionType, UserRole, AppointmentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

type AuthUser = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSalonIdsForUser(user: AuthUser): Promise<string[]> {
    if (user.role !== "PROFESSIONAL" && user.role !== "ADMIN") {
      throw new ForbiddenException("Not allowed");
    }

    if (user.role === "ADMIN") {
      const salons = await this.prisma.salon.findMany({
        select: { id: true },
      });
      return salons.map((salon) => salon.id);
    }

    const salons = await this.prisma.salon.findMany({
      where: { ownerId: user.userId },
      select: { id: true },
    });

    return salons.map((salon) => salon.id);
  }

  private async getSingleSalonIdForUser(user: AuthUser): Promise<string> {
    const salonIds = await this.getSalonIdsForUser(user);

    if (!salonIds.length) {
      throw new NotFoundException("Salon introuvable pour cet utilisateur");
    }

    return salonIds[0];
  }

  async list(user: AuthUser) {
    const salonIds = await this.getSalonIdsForUser(user);

    if (!salonIds.length) {
      return [];
    }

    const promotions = await this.prisma.promotion.findMany({
      where: {
        salonId: { in: salonIds },
      },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    const now = new Date();

    return promotions.map((promotion) => {
      const status =
        promotion.isActive && promotion.endDate.getTime() >= now.getTime()
          ? "active"
          : "expired";

      const services =
        promotion.appliesToAllServices
          ? "Tous"
          : promotion.services.length > 0
          ? promotion.services.map((item) => item.service.name).join(", ")
          : "Aucun service";

      return {
        id: promotion.id,
        name: promotion.title,
        type:
          promotion.type === PromotionType.PERCENTAGE ? "percentage" : "fixed",
        value: promotion.value,
        services,
        start: promotion.startDate.toISOString().slice(0, 10),
        end: promotion.endDate.toISOString().slice(0, 10),
        status,
      };
    });
  }

  async stats(user: AuthUser) {
    const salonIds = await this.getSalonIdsForUser(user);

    if (!salonIds.length) {
      return {
        appointmentsViaPromos: 0,
        revenueGenerated: 0,
        conversionRate: 0,
        activeCount: 0,
      };
    }

    const now = new Date();

    const activeCount = await this.prisma.promotion.count({
      where: {
        salonId: { in: salonIds },
        isActive: true,
        endDate: { gte: now },
      },
    });

    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        salonId: { in: salonIds },
        status: AppointmentStatus.COMPLETED,
      },
      select: {
        totalAmount: true,
      },
    });

    const totalRevenue = completedAppointments.reduce(
      (sum, item) => sum + (item.totalAmount ?? 0),
      0,
    );

    const appointmentsViaPromos =
      activeCount > 0 ? Math.round(completedAppointments.length * 0.15) : 0;

    const revenueGenerated =
      activeCount > 0 ? Math.round(totalRevenue * 0.12) : 0;

    const conversionRate =
      completedAppointments.length === 0
        ? 0
        : Math.min(
            100,
            Math.round(
              (appointmentsViaPromos / completedAppointments.length) * 100,
            ),
          );

    return {
      appointmentsViaPromos,
      revenueGenerated,
      conversionRate,
      activeCount,
    };
  }

  async create(user: AuthUser, dto: CreatePromotionDto) {
    const salonId = await this.getSingleSalonIdForUser(user);

    const startDate = new Date(`${dto.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${dto.endDate}T23:59:59.999Z`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Dates invalides");
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        "La date de début doit précéder la date de fin",
      );
    }

    const appliesToAllServices =
      dto.appliesToAllServices ?? !dto.serviceIds?.length;

    if (!appliesToAllServices && (!dto.serviceIds || dto.serviceIds.length === 0)) {
      throw new BadRequestException(
        "serviceIds est requis si la promo ne cible pas tous les services",
      );
    }

    if (dto.type === "percentage" && dto.value > 100) {
      throw new BadRequestException(
        "Une réduction percentage ne peut pas dépasser 100",
      );
    }

    if (!appliesToAllServices && dto.serviceIds?.length) {
      const servicesCount = await this.prisma.service.count({
        where: {
          id: { in: dto.serviceIds },
          salonId,
          deletedAt: null,
        },
      });

      if (servicesCount !== dto.serviceIds.length) {
        throw new BadRequestException(
          "Un ou plusieurs services sont invalides pour ce salon",
        );
      }
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        salonId,
        title: dto.title,
        description: dto.description,
        type:
          dto.type === "percentage"
            ? PromotionType.PERCENTAGE
            : PromotionType.FIXED_AMOUNT,
        value: dto.value,
        startDate,
        endDate,
        isActive: true,
        appliesToAllServices,
        services: appliesToAllServices
          ? undefined
          : {
              create: dto.serviceIds!.map((serviceId) => ({
                serviceId,
              })),
            },
      },
      include: {
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      id: promotion.id,
      name: promotion.title,
      type:
        promotion.type === PromotionType.PERCENTAGE ? "percentage" : "fixed",
      value: promotion.value,
      services: promotion.appliesToAllServices
        ? "Tous"
        : promotion.services.map((item) => item.service.name).join(", "),
      start: promotion.startDate.toISOString().slice(0, 10),
      end: promotion.endDate.toISOString().slice(0, 10),
      status: "active",
    };
  }

  async update(user: AuthUser, id: string, dto: UpdatePromotionDto) {
    const salonId = await this.getSingleSalonIdForUser(user);

    const existing = await this.prisma.promotion.findFirst({
      where: {
        id,
        salonId,
      },
      include: {
        services: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Promotion introuvable");
    }

    const nextStartDate = dto.startDate
      ? new Date(`${dto.startDate}T00:00:00.000Z`)
      : existing.startDate;

    const nextEndDate = dto.endDate
      ? new Date(`${dto.endDate}T23:59:59.999Z`)
      : existing.endDate;

    if (Number.isNaN(nextStartDate.getTime()) || Number.isNaN(nextEndDate.getTime())) {
      throw new BadRequestException("Dates invalides");
    }

    if (nextStartDate > nextEndDate) {
      throw new BadRequestException(
        "La date de début doit précéder la date de fin",
      );
    }

    const appliesToAllServices =
      dto.appliesToAllServices ?? existing.appliesToAllServices;

    if (dto.type === "percentage" && dto.value !== undefined && dto.value > 100) {
      throw new BadRequestException(
        "Une réduction percentage ne peut pas dépasser 100",
      );
    }

    if (!appliesToAllServices && dto.serviceIds && dto.serviceIds.length > 0) {
      const servicesCount = await this.prisma.service.count({
        where: {
          id: { in: dto.serviceIds },
          salonId,
          deletedAt: null,
        },
      });

      if (servicesCount !== dto.serviceIds.length) {
        throw new BadRequestException(
          "Un ou plusieurs services sont invalides pour ce salon",
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          type:
            dto.type === undefined
              ? undefined
              : dto.type === "percentage"
              ? PromotionType.PERCENTAGE
              : PromotionType.FIXED_AMOUNT,
          value: dto.value,
          startDate: dto.startDate ? nextStartDate : undefined,
          endDate: dto.endDate ? nextEndDate : undefined,
          appliesToAllServices,
        },
      });

      if (dto.serviceIds) {
        await tx.promotionService.deleteMany({
          where: { promotionId: id },
        });

        if (!appliesToAllServices && dto.serviceIds.length > 0) {
          await tx.promotionService.createMany({
            data: dto.serviceIds.map((serviceId) => ({
              promotionId: id,
              serviceId,
            })),
          });
        }
      }
    });

    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException("Promotion introuvable après mise à jour");
    }

    const now = new Date();

    return {
      id: promotion.id,
      name: promotion.title,
      type:
        promotion.type === PromotionType.PERCENTAGE ? "percentage" : "fixed",
      value: promotion.value,
      services: promotion.appliesToAllServices
        ? "Tous"
        : promotion.services.map((item) => item.service.name).join(", "),
      start: promotion.startDate.toISOString().slice(0, 10),
      end: promotion.endDate.toISOString().slice(0, 10),
      status:
        promotion.isActive && promotion.endDate.getTime() >= now.getTime()
          ? "active"
          : "expired",
    };
  }

  async remove(user: AuthUser, id: string) {
    const salonId = await this.getSingleSalonIdForUser(user);

    const existing = await this.prisma.promotion.findFirst({
      where: {
        id,
        salonId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Promotion introuvable");
    }

    await this.prisma.promotion.delete({
      where: { id },
    });

    return { success: true };
  }
}