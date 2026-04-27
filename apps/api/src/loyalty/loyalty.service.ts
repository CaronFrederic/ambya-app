import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLoyaltyConfigDto } from "./dto/update-loyalty-config.dto";

type AuthUser = {
  userId: string;
  role: UserRole;
};

type RewardRulesJson = {
  cardType?: "stamps" | "points" | "progressive";
  programDesc?: string;
  stampsRequired?: number;
  silverAt?: number;
  goldAt?: number;
  platinumAt?: number;
};

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSalonIdForUser(user: AuthUser): Promise<string> {
    if (user.role !== UserRole.PROFESSIONAL && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not allowed");
    }

    if (user.role === UserRole.ADMIN) {
      const salon = await this.prisma.salon.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!salon) {
        throw new NotFoundException("Aucun salon trouvé");
      }

      return salon.id;
    }

    const salon = await this.prisma.salon.findFirst({
      where: { ownerId: user.userId },
      select: { id: true },
    });

    if (!salon) {
      throw new NotFoundException("Salon introuvable pour cet utilisateur");
    }

    return salon.id;
  }

  async getConfig(user: AuthUser) {
    const salonId = await this.getSalonIdForUser(user);

    const config = await this.prisma.loyaltyConfig.findUnique({
      where: { salonId },
    });

    const rules = (config?.rewardRulesJson ?? {}) as RewardRulesJson;

    return {
      enabled: config?.enabled ?? false,
      cardType: rules.cardType ?? "stamps",
      programName: config?.cardName ?? "Carte de fidélité",
      programDesc: rules.programDesc ?? "",
      stamps: rules.stampsRequired ?? 10,
    };
  }

  async updateConfig(user: AuthUser, dto: UpdateLoyaltyConfigDto) {
    const salonId = await this.getSalonIdForUser(user);

    const existing = await this.prisma.loyaltyConfig.findUnique({
      where: { salonId },
    });

    const currentRules = (existing?.rewardRulesJson ?? {}) as RewardRulesJson;

    const nextRules: RewardRulesJson = {
      ...currentRules,
      cardType: dto.cardType,
      programDesc: dto.programDesc ?? "",
      stampsRequired: dto.stamps,
    };

    const config = existing
      ? await this.prisma.loyaltyConfig.update({
          where: { salonId },
          data: {
            enabled: dto.enabled,
            cardName: dto.programName,
            rewardRulesJson: nextRules,
          },
        })
      : await this.prisma.loyaltyConfig.create({
          data: {
            salonId,
            enabled: dto.enabled,
            cardName: dto.programName,
            pointsPerVisit: 10,
            pointsPerAmount: 1,
            rewardRulesJson: nextRules,
          },
        });

    const rules = (config.rewardRulesJson ?? {}) as RewardRulesJson;

    return {
      enabled: config.enabled,
      cardType: rules.cardType ?? "stamps",
      programName: config.cardName ?? "Carte de fidélité",
      programDesc: rules.programDesc ?? "",
      stamps: rules.stampsRequired ?? 10,
    };
  }

  async getStats(user: AuthUser) {
    const salonId = await this.getSalonIdForUser(user);

    const [activeCards, completedAppointments, regularClients, totalClients] =
      await Promise.all([
        this.prisma.salonClient.count({
          where: {
            salonId,
            isBlocked: false,
          },
        }),
        this.prisma.appointment.count({
          where: {
            salonId,
            status: AppointmentStatus.COMPLETED,
          },
        }),
        this.prisma.salonClient.count({
          where: {
            salonId,
            isRegular: true,
          },
        }),
        this.prisma.salonClient.count({
          where: {
            salonId,
          },
        }),
      ]);

    const rewardsGranted = await this.prisma.loyaltyTransaction.count({
      where: {
        deltaPoints: {
          lt: 0,
        },
        loyaltyAccount: {
          user: {
            salonMemberships: {
              some: {
                salonId,
              },
            },
          },
        },
      },
    });

    const usageRate =
      activeCards === 0 ? 0 : Math.min(100, Math.round((completedAppointments / activeCards) * 10));

    const retentionRate =
      totalClients === 0 ? 0 : Math.round((regularClients / totalClients) * 100);

    return {
      activeCards,
      usageRate,
      rewardsGranted,
      retentionRate,
    };
  }

  async getClients(user: AuthUser) {
    const salonId = await this.getSalonIdForUser(user);

    const config = await this.prisma.loyaltyConfig.findUnique({
      where: { salonId },
    });

    const rules = (config?.rewardRulesJson ?? {}) as RewardRulesJson;
    const cardType = rules.cardType ?? "stamps";
    const stampsRequired = rules.stampsRequired ?? 10;

    const clients = await this.prisma.salonClient.findMany({
      where: {
        salonId,
        isBlocked: false,
      },
      include: {
        client: {
          include: {
            clientProfile: true,
            loyaltyAccount: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    return clients.map((client) => {
      const displayName =
        client.client.clientProfile?.nickname ||
        client.client.email ||
        client.client.phone ||
        "Client";

      let progress = 0;
      let total = stampsRequired;

      if (cardType === "points") {
        progress = client.client.loyaltyAccount?.currentPoints ?? 0;
        total = 1000;
      } else if (cardType === "progressive") {
        progress = client.completedCount ?? 0;
        total = 10;
      } else {
        progress = client.completedCount ?? 0;
        total = stampsRequired;
      }

      return {
        id: client.id,
        name: displayName,
        progress: Math.max(0, progress),
        total: Math.max(1, total),
      };
    });
  }
}