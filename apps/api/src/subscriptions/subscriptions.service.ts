import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SubscriptionPaymentMethod,
  SubscriptionPaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  PAID_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_CATALOG,
} from './subscriptions.constants';

type CurrentUser = {
  userId: string;
  role: UserRole;
};

export type SubscriptionFeature =
  | 'EMPLOYEES'
  | 'EXPENSES'
  | 'MANAGEMENT_REGISTER';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getManagedSalon(user: CurrentUser) {
    if (
      user.role !== UserRole.PROFESSIONAL &&
      user.role !== UserRole.SALON_MANAGER &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    const salon = await this.prisma.salon.findFirst({
      where: user.role === UserRole.ADMIN ? {} : { ownerId: user.userId },
      select: { id: true, name: true },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    return salon;
  }

  private addOneMonth(date: Date) {
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + 1);
    return result;
  }

  private async ensureSubscription(salonId: string) {
    return this.prisma.salonSubscription.upsert({
      where: { salonId },
      create: {
        salonId,
        plan: SubscriptionPlan.DISCOVERY,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: false,
        cancelAtPeriodEnd: false,
      },
      update: {},
    });
  }

  private async normalizeExpiredSubscription(salonId: string) {
    const subscription = await this.ensureSubscription(salonId);
    const now = new Date();

    if (
      subscription.plan !== SubscriptionPlan.DISCOVERY &&
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd <= now
    ) {
      return this.prisma.salonSubscription.update({
        where: { salonId },
        data: {
          plan: SubscriptionPlan.DISCOVERY,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          pendingPlan: null,
        },
      });
    }

    return subscription;
  }

  private serialize(subscription: Awaited<ReturnType<SubscriptionsService['ensureSubscription']>>) {
    const catalog = SUBSCRIPTION_CATALOG[subscription.plan];

    return {
      id: subscription.id,
      plan: subscription.plan,
      planName: catalog.name,
      price: catalog.price,
      commissionPct: catalog.commissionPct,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
      pendingPlan: subscription.pendingPlan,
      autoRenew: subscription.autoRenew,
    };
  }

  getPlans() {
    return Object.values(SUBSCRIPTION_CATALOG).map((offer) => ({
      ...offer,
      currency: 'XAF',
    }));
  }

  async getCurrent(user: CurrentUser) {
    const salon = await this.getManagedSalon(user);
    const subscription = await this.normalizeExpiredSubscription(salon.id);

    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { salonId: salon.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      salonId: salon.id,
      salonName: salon.name,
      subscription: this.serialize(subscription),
      payments: payments.map((payment) => ({
        id: payment.id,
        plan: payment.plan,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        provider: payment.provider,
        providerRef: payment.providerRef,
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
      })),
    };
  }

  async subscribe(user: CurrentUser, dto: CreateSubscriptionDto) {
    const salon = await this.getManagedSalon(user);

    if (!PAID_SUBSCRIPTION_PLANS.includes(dto.plan as any)) {
      throw new BadRequestException('Choose ESSENTIAL or PREMIUM');
    }

    const current = await this.normalizeExpiredSubscription(salon.id);
    const offer = SUBSCRIPTION_CATALOG[dto.plan];

    if (
      current.plan === dto.plan &&
      current.status === SubscriptionStatus.ACTIVE &&
      current.currentPeriodEnd &&
      current.currentPeriodEnd > new Date()
    ) {
      throw new BadRequestException('This plan is already active');
    }

    const existingPending = await this.prisma.subscriptionPayment.findFirst({
      where: {
        salonId: salon.id,
        plan: dto.plan,
        status: SubscriptionPaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPending) {
      return {
        payment: existingPending,
        subscription: this.serialize(current),
      };
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      await tx.salonSubscription.update({
        where: { salonId: salon.id },
        data: {
          pendingPlan: dto.plan,
          status:
            current.plan === SubscriptionPlan.DISCOVERY
              ? SubscriptionStatus.PENDING_PAYMENT
              : current.status,
        },
      });

      return tx.subscriptionPayment.create({
        data: {
          salonId: salon.id,
          subscriptionId: current.id,
          plan: dto.plan,
          amount: offer.price,
          currency: 'XAF',
          method: dto.paymentMethod,
          status: SubscriptionPaymentStatus.PENDING,
          provider:
            dto.paymentMethod === SubscriptionPaymentMethod.MANUAL_MOBILE_MONEY
              ? 'MANUAL'
              : 'PENDING_PROVIDER',
        },
      });
    });

    const updated = await this.prisma.salonSubscription.findUniqueOrThrow({
      where: { salonId: salon.id },
    });

    return {
      payment,
      subscription: this.serialize(updated),
      message: 'Paiement créé. L’abonnement sera activé après confirmation du paiement.',
    };
  }

  async cancel(user: CurrentUser) {
    const salon = await this.getManagedSalon(user);
    const current = await this.normalizeExpiredSubscription(salon.id);

    if (current.plan === SubscriptionPlan.DISCOVERY) {
      throw new BadRequestException('Découverte ne nécessite pas d’annulation');
    }

    if (current.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('No active paid subscription');
    }

    const updated = await this.prisma.salonSubscription.update({
      where: { salonId: salon.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });

    return this.serialize(updated);
  }

  async confirmPaymentForBeta(user: CurrentUser, paymentId: string) {
    if (
      user.role !== UserRole.PROFESSIONAL &&
      user.role !== UserRole.SALON_MANAGER &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    const salon = await this.getManagedSalon(user);
    const payment = await this.prisma.subscriptionPayment.findFirst({
      where: { id: paymentId, salonId: salon.id },
    });

    if (!payment) {
      throw new NotFoundException('Subscription payment not found');
    }

    if (payment.status === SubscriptionPaymentStatus.SUCCEEDED) {
      return this.getCurrent(user);
    }

    if (payment.status !== SubscriptionPaymentStatus.PENDING) {
      throw new BadRequestException('Payment cannot be confirmed');
    }

    const now = new Date();
    const periodEnd = this.addOneMonth(now);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: SubscriptionPaymentStatus.SUCCEEDED,
          paidAt: now,
          provider: 'BETA_MANUAL_CONFIRMATION',
        },
      });

      await tx.salonSubscription.update({
        where: { salonId: salon.id },
        data: {
          plan: payment.plan,
          pendingPlan: null,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          autoRenew: false,
        },
      });
    });

    return this.getCurrent(user);
  }

  async assertFeatureAccess(user: CurrentUser, feature: SubscriptionFeature) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const salon = await this.getManagedSalon(user);
    const subscription = await this.normalizeExpiredSubscription(salon.id);
    const plan = subscription.plan;
    const isActive = subscription.status === SubscriptionStatus.ACTIVE;

    const allowed =
      isActive &&
      (feature === 'MANAGEMENT_REGISTER'
        ? plan === SubscriptionPlan.PREMIUM
        : plan === SubscriptionPlan.ESSENTIAL ||
          plan === SubscriptionPlan.PREMIUM);

    if (!allowed) {
      const message =
        feature === 'MANAGEMENT_REGISTER'
          ? 'Le Registre de gestion est réservé à l’offre Premium.'
          : feature === 'EMPLOYEES'
            ? 'La gestion des employés est disponible avec les offres Essentiel et Premium.'
            : 'La gestion des dépenses est disponible avec les offres Essentiel et Premium.';

      throw new ForbiddenException(message);
    }
  }

  async getCommissionPctForSalon(salonId: string) {
    const subscription = await this.normalizeExpiredSubscription(salonId);
    return SUBSCRIPTION_CATALOG[subscription.plan].commissionPct;
  }
}
