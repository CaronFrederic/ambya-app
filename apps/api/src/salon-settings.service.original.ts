import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpsertSalonSettingsDto } from './dto/upsert-salon-settings.dto';

type CurrentUser = {
  userId: string;
  role: UserRole;
};

const DAY_TO_INDEX: Record<string, number> = {
  Lundi: 1,
  Mardi: 2,
  Mercredi: 3,
  Jeudi: 4,
  Vendredi: 5,
  Samedi: 6,
  Dimanche: 0,
};

const INDEX_TO_DAY: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

function getStringValue(
  source: Prisma.JsonObject,
  key: string,
  fallback = '',
): string {
  const value = source[key];
  return typeof value === 'string' ? value : fallback;
}

@Injectable()
export class SalonSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getManagedSalon(user: CurrentUser) {
    if (
      user.role !== 'PROFESSIONAL' &&
      user.role !== 'SALON_MANAGER' &&
      user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('Access denied');
    }

    const salon = await this.prisma.salon.findFirst({
      where: {
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.userId }),
      },
      include: {
        openingHours: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    return salon;
  }

  async uploadPhoto(user: CurrentUser, file: any, baseUrl: string) {
    const salon = await this.getManagedSalon(user);

    if (!file?.buffer || !file?.mimetype) {
      throw new BadRequestException('Fichier image invalide.');
    }

    const fallbackExtension = MIME_TO_EXTENSION[file.mimetype];

    if (!fallbackExtension) {
      throw new BadRequestException('Format d’image non supporté.');
    }

    const originalExtension = extname(file.originalname ?? '').toLowerCase();
    const allowedExtensions = new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.heic',
      '.heif',
    ]);

    const extension = allowedExtensions.has(originalExtension)
      ? originalExtension === '.jpeg'
        ? '.jpg'
        : originalExtension
      : fallbackExtension;

    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const relativeDirectory = join('salons', salon.id);
    const absoluteDirectory = join(process.cwd(), 'uploads', relativeDirectory);

    mkdirSync(absoluteDirectory, { recursive: true });

    const absolutePath = join(absoluteDirectory, fileName);
    writeFileSync(absolutePath, file.buffer);

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const publicPath = `/uploads/salons/${salon.id}/${fileName}`;

    return {
      url: `${normalizedBaseUrl}${publicPath}`,
    };
  }

  async getSettings(user: CurrentUser) {
    const salon = await this.getManagedSalon(user);

    const rawPaymentSettings =
      salon.paymentSettings && typeof salon.paymentSettings === 'object'
        ? (salon.paymentSettings as Prisma.JsonObject)
        : {};

    const categories = salon.categories ?? [];

    const scheduleByDay: Record<
      string,
      { start: string; end: string; enabled: boolean }[]
    > = {
      Lundi: [],
      Mardi: [],
      Mercredi: [],
      Jeudi: [],
      Vendredi: [],
      Samedi: [],
      Dimanche: [],
    };

    for (const row of salon.openingHours) {
      const label = INDEX_TO_DAY[row.dayOfWeek];
      if (!label) continue;

      scheduleByDay[label].push({
        start: row.startTime,
        end: row.endTime,
        enabled: row.isOpen,
      });
    }

    const standardSource = scheduleByDay['Lundi']?.length
      ? scheduleByDay['Lundi']
      : [{ start: '09:00', end: '18:00', enabled: true }];

    const scheduleType =
      typeof rawPaymentSettings.scheduleType === 'string' &&
      (rawPaymentSettings.scheduleType === 'standard' ||
        rawPaymentSettings.scheduleType === 'custom')
        ? rawPaymentSettings.scheduleType
        : 'standard';

    const rawSubscriptionPlan = getStringValue(
      rawPaymentSettings,
      'subscriptionPlan',
      'FREE',
    );
    const subscriptionPlan = ['FREE', 'PRO', 'BUSINESS'].includes(
      rawSubscriptionPlan,
    )
      ? rawSubscriptionPlan
      : 'FREE';

    const rawSubscriptionStatus = getStringValue(
      rawPaymentSettings,
      'subscriptionStatus',
      'ACTIVE',
    );
    const subscriptionStatus = ['ACTIVE', 'CANCELLED'].includes(
      rawSubscriptionStatus,
    )
      ? rawSubscriptionStatus
      : 'ACTIVE';

    return {
      id: salon.id,
      name: salon.name ?? '',
      description: salon.description ?? '',
      address: salon.address ?? '',
      phone: salon.phone ?? '',
      email: salon.email ?? '',
      categories,

      coverImageUrl: salon.coverImageUrl ?? null,
      galleryImageUrls: Array.isArray(salon.galleryImageUrls)
        ? salon.galleryImageUrls
        : [],

      instagramHandle: salon.instagramHandle ?? '',
      showInstagramFeed: salon.showInstagramFeed ?? false,
      tiktokHandle: salon.tiktokHandle ?? '',
      showTikTokFeed: salon.showTikTokFeed ?? false,
      facebookUrl: salon.facebookUrl ?? '',
      websiteUrl: salon.websiteUrl ?? '',

      scheduleType,
      standardSlots: standardSource,
      customSlots: scheduleByDay,

      paymentSettings: {
        payMobileMoney: Boolean(rawPaymentSettings.payMobileMoney),
        payCard: Boolean(rawPaymentSettings.payCard),
        payCash:
          rawPaymentSettings.payCash === undefined
            ? true
            : Boolean(rawPaymentSettings.payCash),
        orangeMoney: getStringValue(rawPaymentSettings, 'orangeMoney'),
        moovMoney: getStringValue(rawPaymentSettings, 'moovMoney'),
        airtelMoney: getStringValue(rawPaymentSettings, 'airtelMoney'),
        bankName: getStringValue(rawPaymentSettings, 'bankName'),
        iban: getStringValue(rawPaymentSettings, 'iban'),
        bankOwner: getStringValue(rawPaymentSettings, 'bankOwner'),
        cancelPolicyHours:
          typeof rawPaymentSettings.cancelPolicyHours === 'number'
            ? rawPaymentSettings.cancelPolicyHours
            : 12,
        subscriptionPlan,
        subscriptionStatus,
        subscriptionStartedAt:
          typeof rawPaymentSettings.subscriptionStartedAt === 'string'
            ? rawPaymentSettings.subscriptionStartedAt
            : null,
        subscriptionCancelledAt:
          typeof rawPaymentSettings.subscriptionCancelledAt === 'string'
            ? rawPaymentSettings.subscriptionCancelledAt
            : null,
      },

      depositEnabled: salon.depositEnabled,
      depositPercentage: salon.depositPercentage,
    };
  }

  async upsertSettings(user: CurrentUser, dto: UpsertSalonSettingsDto) {
    const salon = await this.getManagedSalon(user);

    const categories = dto.categories ?? [];

    const rawPaymentSettings =
      salon.paymentSettings && typeof salon.paymentSettings === 'object'
        ? (salon.paymentSettings as Prisma.JsonObject)
        : {};

    const subscriptionPlan =
      dto.paymentSettings.subscriptionPlan ??
      (['FREE', 'PRO', 'BUSINESS'].includes(
        getStringValue(rawPaymentSettings, 'subscriptionPlan', 'FREE'),
      )
        ? getStringValue(rawPaymentSettings, 'subscriptionPlan', 'FREE')
        : 'FREE');

    const subscriptionStatus =
      dto.paymentSettings.subscriptionStatus ??
      (['ACTIVE', 'CANCELLED'].includes(
        getStringValue(rawPaymentSettings, 'subscriptionStatus', 'ACTIVE'),
      )
        ? getStringValue(rawPaymentSettings, 'subscriptionStatus', 'ACTIVE')
        : 'ACTIVE');

    const paymentSettings: Prisma.InputJsonObject = {
      payMobileMoney: dto.paymentSettings.payMobileMoney,
      payCard: dto.paymentSettings.payCard,
      payCash: dto.paymentSettings.payCash,
      orangeMoney: dto.paymentSettings.orangeMoney ?? '',
      moovMoney: dto.paymentSettings.moovMoney ?? '',
      airtelMoney: dto.paymentSettings.airtelMoney ?? '',
      bankName: dto.paymentSettings.bankName ?? '',
      iban: dto.paymentSettings.iban ?? '',
      bankOwner: dto.paymentSettings.bankOwner ?? '',
      cancelPolicyHours: dto.paymentSettings.cancelPolicyHours ?? 12,
      scheduleType: dto.scheduleType,
      subscriptionPlan,
      subscriptionStatus,
      subscriptionStartedAt:
        dto.paymentSettings.subscriptionStartedAt ??
        getStringValue(rawPaymentSettings, 'subscriptionStartedAt'),
      subscriptionCancelledAt:
        dto.paymentSettings.subscriptionCancelledAt ??
        getStringValue(rawPaymentSettings, 'subscriptionCancelledAt'),
    };

    const scheduleRows =
      dto.scheduleType === 'standard'
        ? Object.entries(DAY_TO_INDEX).flatMap(([, dayIndex]) =>
            dto.standardSlots.map((slot) => ({
              dayOfWeek: dayIndex,
              startTime: slot.start,
              endTime: slot.end,
              isOpen: slot.enabled,
            })),
          )
        : Object.entries(dto.customSlots).flatMap(([dayLabel, slots]) => {
            const dayIndex = DAY_TO_INDEX[dayLabel];
            if (dayIndex === undefined) return [];

            return slots.map((slot) => ({
              dayOfWeek: dayIndex,
              startTime: slot.start,
              endTime: slot.end,
              isOpen: slot.enabled,
            }));
          });

    await this.prisma.$transaction(async (tx) => {
      await tx.salon.update({
        where: { id: salon.id },
        data: {
          name: dto.name,
          description: dto.description ?? null,
          address: dto.address ?? null,
          phone: dto.phone ?? null,
          email: dto.email ?? null,

          coverImageUrl: dto.coverImageUrl ?? null,
          galleryImageUrls: dto.galleryImageUrls ?? [],

          instagramHandle: dto.instagramHandle ?? null,
          showInstagramFeed: dto.showInstagramFeed ?? false,
          tiktokHandle: dto.tiktokHandle ?? null,
          showTikTokFeed: dto.showTikTokFeed ?? false,
          facebookUrl: dto.facebookUrl ?? null,
          websiteUrl: dto.websiteUrl ?? null,

          depositEnabled: dto.depositEnabled,
          depositPercentage: dto.depositPercentage,
          categories,

          paymentSettings,
        },
      });

      await tx.salonOpeningHour.deleteMany({
        where: { salonId: salon.id },
      });

      if (scheduleRows.length > 0) {
        await tx.salonOpeningHour.createMany({
          data: scheduleRows.map((row) => ({
            salonId: salon.id,
            ...row,
          })),
        });
      }
    });

    return this.getSettings(user);
  }
}
