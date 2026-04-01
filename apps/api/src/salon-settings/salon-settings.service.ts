import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, UserRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UpsertSalonSettingsDto } from './dto/upsert-salon-settings.dto'

type CurrentUser = {
  userId: string
  role: UserRole
}

const DAY_TO_INDEX: Record<string, number> = {
  Lundi: 1,
  Mardi: 2,
  Mercredi: 3,
  Jeudi: 4,
  Vendredi: 5,
  Samedi: 6,
  Dimanche: 0,
}

const INDEX_TO_DAY: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}

@Injectable()
export class SalonSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getManagedSalon(user: CurrentUser) {
    if (user.role !== 'PROFESSIONAL' && user.role !== 'SALON_MANAGER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied')
    }

    const salon = await this.prisma.salon.findFirst({
      where: {
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.userId }),
      },
      include: {
        salonSchedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    })

    if (!salon) {
      throw new NotFoundException('Salon not found')
    }

    return salon
  }

  async getSettings(user: CurrentUser) {
    const salon = await this.getManagedSalon(user)

    const rawPaymentSettings =
      salon.paymentSettings && typeof salon.paymentSettings === 'object'
        ? (salon.paymentSettings as Prisma.JsonObject)
        : {}

    const categories =
      salon.socialLinks &&
      typeof salon.socialLinks === 'object' &&
      Array.isArray((salon.socialLinks as Prisma.JsonObject).categories)
        ? (((salon.socialLinks as Prisma.JsonObject).categories as Prisma.JsonArray).filter(
            (x): x is string => typeof x === 'string',
          ))
        : []

    const scheduleByDay: Record<string, { start: string; end: string; enabled: boolean }[]> = {
      Lundi: [],
      Mardi: [],
      Mercredi: [],
      Jeudi: [],
      Vendredi: [],
      Samedi: [],
      Dimanche: [],
    }

    for (const row of salon.salonSchedules) {
      const label = INDEX_TO_DAY[row.dayOfWeek]
      if (!label) continue

      scheduleByDay[label].push({
        start: row.startTime,
        end: row.endTime,
        enabled: row.isOpen,
      })
    }

    const standardSource = scheduleByDay['Lundi']?.length
      ? scheduleByDay['Lundi']
      : [{ start: '09:00', end: '18:00', enabled: true }]

    const scheduleType =
      typeof rawPaymentSettings.scheduleType === 'string' &&
      (rawPaymentSettings.scheduleType === 'standard' ||
        rawPaymentSettings.scheduleType === 'custom')
        ? rawPaymentSettings.scheduleType
        : 'standard'

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
        orangeMoney:
          typeof rawPaymentSettings.orangeMoney === 'string'
            ? rawPaymentSettings.orangeMoney
            : '',
        moovMoney:
          typeof rawPaymentSettings.moovMoney === 'string'
            ? rawPaymentSettings.moovMoney
            : '',
        airtelMoney:
          typeof rawPaymentSettings.airtelMoney === 'string'
            ? rawPaymentSettings.airtelMoney
            : '',
        bankName:
          typeof rawPaymentSettings.bankName === 'string'
            ? rawPaymentSettings.bankName
            : '',
        iban:
          typeof rawPaymentSettings.iban === 'string'
            ? rawPaymentSettings.iban
            : '',
        bankOwner:
          typeof rawPaymentSettings.bankOwner === 'string'
            ? rawPaymentSettings.bankOwner
            : '',
        cancelPolicyHours:
          typeof rawPaymentSettings.cancelPolicyHours === 'number'
            ? rawPaymentSettings.cancelPolicyHours
            : 12,
      },

      depositEnabled: salon.depositEnabled,
      depositPercentage: salon.depositPercentage,
    }
  }

  async upsertSettings(user: CurrentUser, dto: UpsertSalonSettingsDto) {
    const salon = await this.getManagedSalon(user)

    const categoriesJson = dto.categories ?? []

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
    }

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
            const dayIndex = DAY_TO_INDEX[dayLabel]
            if (dayIndex === undefined) return []
            return slots.map((slot) => ({
              dayOfWeek: dayIndex,
              startTime: slot.start,
              endTime: slot.end,
              isOpen: slot.enabled,
            }))
          })

    return this.prisma.$transaction(async (tx) => {
      const updatedSalon = await tx.salon.update({
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

          paymentSettings,
          socialLinks: {
            categories: categoriesJson,
          },
        },
      })

      await tx.salonSchedule.deleteMany({
        where: { salonId: salon.id },
      })

      if (scheduleRows.length > 0) {
        await tx.salonSchedule.createMany({
          data: scheduleRows.map((row) => ({
            salonId: salon.id,
            ...row,
          })),
        })
      }

      return updatedSalon
    })
  }
}