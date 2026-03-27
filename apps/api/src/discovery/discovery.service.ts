import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HomeQueryDto } from './dto/home-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { SalonAvailabilityQueryDto } from './dto/salon-availability-query.dto';
import {
  employeeCanPerformCategory,
  getEmployeeSpecialtyLabels,
  getPrimaryEmployeeSpecialtyLabel,
} from '../common/employee-specialties';

type Slot = {
  time: string;
  available: boolean;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async home(query: HomeQueryDto) {
    const where: any = { isActive: true };
    const clientCoordinates = this.parseCoordinates(
      query.latitude,
      query.longitude,
    );

    const salons = await this.prisma.salon.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        services: {
          where: { isActive: true },
          select: { id: true, name: true, category: true, durationMin: true, price: true },
          orderBy: { price: 'asc' },
          take: 4,
        },
        appointments: {
          where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
          select: { id: true },
        },
        reviews: {
          select: { rating: true },
          take: 50,
        },
      },
      take: 40,
    });

    const serviceCategories = await this.prisma.service.findMany({
      where: { isActive: true },
      select: { category: true },
      take: 500,
    });

    const categories = Array.from(
      new Set(serviceCategories.map((s) => this.toCategoryFromEnum(s.category))),
    );

    const filteredByCategory = query.category
      ? salons.filter((salon) =>
          salon.services.some(
            (service) => this.toCategoryFromEnum(service.category) === query.category,
          ),
        )
      : salons;

    const topRatedSalons = filteredByCategory
      .map((salon) => ({
        id: salon.id,
        name: salon.name,
        address: salon.address,
        city: salon.city,
        country: salon.country,
        rating: this.computeAverageRating(salon.reviews),
        duration: salon.services[0]
          ? `${salon.services[0].durationMin} min`
          : '30 min',
        coordinates: this.resolveSalonCoordinates(salon),
        geoRank: this.computeGeoRank(salon, query.city, query.country),
        distanceKm: this.computeDistanceKm(
          clientCoordinates,
          this.resolveSalonCoordinates(salon),
        ),
      }))
      .sort((a, b) => {
        if (query.nearMe === 'true' && a.distanceKm !== b.distanceKm) {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        }
        if (a.geoRank !== b.geoRank) return a.geoRank - b.geoRank;
        return b.rating - a.rating;
      })
      .slice(0, 12);

    const offers = filteredByCategory
      .filter((salon) => salon.services[0])
      .slice(0, 20)
      .map((salon) => {
        const service = salon.services[0]!;
        return {
          salonId: salon.id,
          salonName: salon.name,
          serviceId: service.id,
          serviceName: service.name,
          discountPercent: 0,
          highlightLabel: this.toCategoryFromEnum(service.category),
          originalPrice: service.price,
          discountedPrice: service.price,
        };
      });

    const mapSalons = topRatedSalons
      .filter((salon) => salon.coordinates)
      .map((salon) => ({
        id: salon.id,
        name: salon.name,
        city: salon.city,
        country: salon.country,
        rating: salon.rating,
        duration: salon.duration,
        distanceKm: salon.distanceKm,
        latitude: salon.coordinates!.latitude,
        longitude: salon.coordinates!.longitude,
      }));

    return {
      categories,
      offers,
      topRatedSalons: topRatedSalons.map(
        ({ geoRank, coordinates, ...salon }) => salon,
      ),
      mapSalons,
    };
  }

  async search(query: SearchQueryDto) {
    const q = query.q?.trim();
    const where: any = { isActive: true };

    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.country)
      where.country = { contains: query.country, mode: 'insensitive' };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        {
          services: {
            some: {
              isActive: true,
              name: { contains: q, mode: 'insensitive' },
            },
          },
        },
        { city: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ];
    }

    const salons = await this.prisma.salon.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        appointments: {
          where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
          select: { id: true },
        },
        reviews: {
          select: { rating: true },
          take: 50,
        },
        services: {
          where: { isActive: true },
          select: { id: true, name: true, category: true, price: true, durationMin: true },
          take: 10,
        },
      },
      take: 80,
    });

    const filtered = query.category
      ? salons.filter((salon) =>
          salon.services.some(
            (service) => this.toCategoryFromEnum(service.category) === query.category,
          ),
        )
      : salons;

    const ranked = filtered
      .map((salon) => ({
        id: salon.id,
        name: salon.name,
        address: salon.address,
        city: salon.city,
        country: salon.country,
        rating: this.computeAverageRating(salon.reviews),
        geoRank: this.computeGeoRank(
          salon,
          query.preferredCity ?? query.city,
          query.preferredCountry ?? query.country,
        ),
        highlights: salon.services.map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMin: service.durationMin,
        })),
      }))
      .sort((a, b) => {
        if (a.geoRank !== b.geoRank) return a.geoRank - b.geoRank;
        return b.rating - a.rating;
      });

    return {
      items: ranked.map(({ geoRank, ...salon }) => salon),
      total: ranked.length,
    };
  }

  async salonDetails(salonId: string) {
    const salon = await this.prisma.salon.findFirst({
      where: { id: salonId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        country: true,
        phone: true,
        coverImageUrl: true,
        galleryImageUrls: true,
        socialLinks: true,
        openingHours: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            price: true,
            durationMin: true,
          },
          orderBy: { name: 'asc' },
        },
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
            },
          },
          orderBy: { displayName: 'asc' },
        },
        appointments: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            createdAt: true,
            client: {
              select: {
                clientProfile: { select: { nickname: true } },
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            client: {
              select: {
                clientProfile: { select: { nickname: true } },
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!salon) throw new NotFoundException('Salon not found');

    const servicesByCategory: Record<string, typeof salon.services> = {};
    for (const service of salon.services) {
      const category = this.toCategoryFromEnum(service.category);
      if (!servicesByCategory[category]) servicesByCategory[category] = [];
      servicesByCategory[category].push(service);
    }


    const explicitReviews = salon.reviews.map((review) => ({
      id: review.id,
      author:
        review.client.clientProfile?.nickname ??
        review.client.email?.split('@')[0] ??
        'Client',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    const reviews = explicitReviews;
    const averageRating = this.computeAverageRating(explicitReviews);

    return {
      id: salon.id,
      name: salon.name,
      description: salon.description,
      address: salon.address,
      city: salon.city,
      country: salon.country,
      phone: salon.phone,
      coverImageUrl:
        typeof salon.coverImageUrl === 'string' && salon.coverImageUrl
          ? salon.coverImageUrl
          : null,
      galleryImageUrls: Array.isArray(salon.galleryImageUrls)
        ? salon.galleryImageUrls.filter(
            (v): v is string => typeof v === 'string' && v.length > 0,
          )
        : [],
      socialLinks: this.normalizeSocialLinks(salon.socialLinks),
      employees: salon.employees.map((employee) => ({
        id: employee.id,
        displayName: employee.displayName,
        specialties: getEmployeeSpecialtyLabels(employee.specialties),
        primarySpecialtyLabel: getPrimaryEmployeeSpecialtyLabel(
          employee.specialties,
        ),
      })),
      openingHours: this.normalizeOpeningHours(salon.openingHours),
      conditions: [],
      responseTimeMin: null,
      servicesByCategory,
      rating: averageRating,
      reviewCount: reviews.length,
      reviews,
    };
  }

  async salonAvailability(salonId: string, query: SalonAvailabilityQueryDto) {
    const salon = await this.prisma.salon.findFirst({
      where: { id: salonId, isActive: true },
      select: {
        id: true,
        openingHours: true,
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            displayName: true,
            specialties: {
              select: { specialty: true },
              orderBy: { specialty: 'asc' },
            },
          },
          orderBy: { displayName: 'asc' },
        },
      },
    });
    if (!salon) throw new NotFoundException('Salon not found');

    const serviceIds = (query.serviceIds ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const selectedServices = serviceIds.length
      ? await this.prisma.service.findMany({
          where: { id: { in: serviceIds }, salonId, isActive: true },
          select: { id: true, durationMin: true, category: true },
        })
      : [];

    const totalDurationMin =
      selectedServices.reduce((sum, service) => sum + service.durationMin, 0) ||
      30;

    const dailyHours = this.getOpeningHoursForDate(query.date, salon.openingHours);
    if (dailyHours?.closed) {
      return {
        date: query.date,
        totalDurationMin,
        slots: [],
        professionals: salon.employees.map((employee) => ({
          id: employee.id,
          displayName: employee.displayName,
          specialties: getEmployeeSpecialtyLabels(employee.specialties),
          primarySpecialtyLabel: getPrimaryEmployeeSpecialtyLabel(
            employee.specialties,
          ),
          slots: [],
        })),
      };
    }

    const openTime = dailyHours?.open ?? '08:00';
    const closeTime = dailyHours?.close ?? '18:00';
    const dayStart = new Date(`${query.date}T${openTime}:00.000Z`);
    const dayEnd = new Date(`${query.date}T${closeTime}:00.000Z`);

    const [appointments, blockedSlots, leaveRequests] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          salonId,
          startAt: { gte: dayStart, lt: dayEnd },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: {
          employeeId: true,
          startAt: true,
          endAt: true,
        },
      }),
      this.prisma.employeeBlockedSlot.findMany({
        where: {
          salonId,
          startAt: { gte: dayStart, lt: dayEnd },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: {
          employeeId: true,
          startAt: true,
          endAt: true,
        },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          employee: { salonId },
          status: 'APPROVED',
          startAt: { lt: dayEnd },
          endAt: { gt: dayStart },
        },
        select: {
          employeeId: true,
          startAt: true,
          endAt: true,
        },
      }),
    ]);

    const slots = this.generateSlots(dayStart, dayEnd, totalDurationMin).filter(
      (slot) => slot.start.getTime() > Date.now(),
    );
    const employeeAppointmentEvents = appointments.reduce<
      Array<{ employeeId: string; startAt: Date; endAt: Date }>
    >((acc, appointment) => {
      if (appointment.employeeId) {
        acc.push({
          employeeId: appointment.employeeId,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
        });
      }
      return acc;
    }, []);

    const employeeEvents = this.groupEventsByEmployee([
      ...employeeAppointmentEvents,
      ...blockedSlots.map((slot) => ({
        employeeId: slot.employeeId,
        startAt: slot.startAt,
        endAt: slot.endAt,
      })),
      ...leaveRequests.map((leave) => ({
        employeeId: leave.employeeId,
        startAt: leave.startAt,
        endAt: leave.endAt,
      })),
    ]);

    const professionals = salon.employees
      .filter(
        (employee) =>
          selectedServices.length === 0 ||
          selectedServices.every((service) =>
            employeeCanPerformCategory(employee.specialties, service.category),
          ),
      )
      .map((employee) => {
        const availability = slots.map((slot) => ({
          time: slot.time,
          available: this.canEmployeeCoverServicesAtSlot(
            employee,
            slot.start,
            selectedServices,
            employeeEvents,
          ),
        }));

        return {
          id: employee.id,
          displayName: employee.displayName,
          specialties: getEmployeeSpecialtyLabels(employee.specialties),
          primarySpecialtyLabel: getPrimaryEmployeeSpecialtyLabel(
            employee.specialties,
          ),
          slots: availability,
        };
      });

    const globalSlots: Slot[] = slots.map((slot) => {
      const available = this.canAnyTeamCoverServicesAtSlot(
        salon.employees,
        slot.start,
        selectedServices,
        employeeEvents,
      );
      return { time: slot.time, available };
    });

    return {
      date: query.date,
      totalDurationMin,
      slots: globalSlots,
      professionals,
    };
  }

  private generateSlots(start: Date, end: Date, durationMin: number) {
    const slots: Array<{ time: string; start: Date; end: Date }> = [];
    const stepMs = 30 * 60_000;

    for (
      let cursor = start.getTime();
      cursor + durationMin * 60_000 <= end.getTime();
      cursor += stepMs
    ) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor + durationMin * 60_000);
      const time = `${String(slotStart.getUTCHours()).padStart(2, '0')}:${String(slotStart.getUTCMinutes()).padStart(2, '0')}`;
      slots.push({ time, start: slotStart, end: slotEnd });
    }

    return slots;
  }

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd;
  }

  private groupEventsByEmployee(
    events: Array<{ employeeId: string; startAt: Date; endAt: Date }>,
  ) {
    const grouped = new Map<
      string,
      Array<{ startAt: Date; endAt: Date }>
    >();

    for (const event of events) {
      const current = grouped.get(event.employeeId) ?? [];
      current.push({ startAt: event.startAt, endAt: event.endAt });
      grouped.set(event.employeeId, current);
    }

    return grouped;
  }

  private buildServiceSegments(
    slotStart: Date,
    services: Array<{ durationMin: number; category: ServiceCategory }>,
    fallbackDurationMin: number,
  ) {
    if (!services.length) {
      return [
        {
          startAt: slotStart,
          endAt: new Date(slotStart.getTime() + fallbackDurationMin * 60_000),
          category: null as ServiceCategory | null,
        },
      ];
    }

    const segments: Array<{
      startAt: Date;
      endAt: Date;
      category: ServiceCategory | null;
    }> = [];
    let cursor = new Date(slotStart);

    for (const service of services) {
      const endAt = new Date(cursor.getTime() + service.durationMin * 60_000);
      segments.push({
        startAt: cursor,
        endAt,
        category: service.category,
      });
      cursor = endAt;
    }

    return segments;
  }

  private employeeHasConflictAtSegment(
    employeeId: string,
    startAt: Date,
    endAt: Date,
    employeeEvents: Map<string, Array<{ startAt: Date; endAt: Date }>>,
  ) {
    const events = employeeEvents.get(employeeId) ?? [];
    return events.some((event) =>
      this.overlaps(startAt, endAt, event.startAt, event.endAt),
    );
  }

  private canEmployeeCoverServicesAtSlot(
    employee: {
      id: string;
      specialties: Array<{ specialty: any }>;
    },
    slotStart: Date,
    services: Array<{ durationMin: number; category: ServiceCategory }>,
    employeeEvents: Map<string, Array<{ startAt: Date; endAt: Date }>>,
  ) {
    const totalDurationMin =
      services.reduce((sum, service) => sum + service.durationMin, 0) || 30;
    const segments = this.buildServiceSegments(
      slotStart,
      services,
      totalDurationMin,
    );

    return segments.every((segment) => {
      if (
        segment.category &&
        !employeeCanPerformCategory(employee.specialties, segment.category)
      ) {
        return false;
      }

      return !this.employeeHasConflictAtSegment(
        employee.id,
        segment.startAt,
        segment.endAt,
        employeeEvents,
      );
    });
  }

  private canAnyTeamCoverServicesAtSlot(
    employees: Array<{
      id: string;
      specialties: Array<{ specialty: any }>;
    }>,
    slotStart: Date,
    services: Array<{ durationMin: number; category: ServiceCategory }>,
    employeeEvents: Map<string, Array<{ startAt: Date; endAt: Date }>>,
  ) {
    const totalDurationMin =
      services.reduce((sum, service) => sum + service.durationMin, 0) || 30;
    const segments = this.buildServiceSegments(
      slotStart,
      services,
      totalDurationMin,
    );

    return segments.every((segment) =>
      employees.some((employee) => {
        if (
          segment.category &&
          !employeeCanPerformCategory(employee.specialties, segment.category)
        ) {
          return false;
        }

        return !this.employeeHasConflictAtSegment(
          employee.id,
          segment.startAt,
          segment.endAt,
          employeeEvents,
        );
      }),
    );
  }

  private normalizeSocialLinks(raw: unknown) {
    if (!raw || typeof raw !== 'object') return {};

    const social = raw as Record<string, unknown>;
    return {
      instagram:
        typeof social.instagram === 'string' && social.instagram
          ? social.instagram
          : undefined,
      facebook:
        typeof social.facebook === 'string' && social.facebook
          ? social.facebook
          : undefined,
      tiktok:
        typeof social.tiktok === 'string' && social.tiktok
          ? social.tiktok
          : undefined,
      website:
        typeof social.website === 'string' && social.website
          ? social.website
          : undefined,
    };
  }

  private normalizeOpeningHours(raw: unknown) {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const entry = item as Record<string, unknown>;
        const day = typeof entry.day === 'string' ? entry.day : null;
        if (!day) return null;

        const closed = Boolean(entry.closed);
        const open =
          typeof entry.open === 'string' && entry.open.trim()
            ? entry.open.trim()
            : null;
        const close =
          typeof entry.close === 'string' && entry.close.trim()
            ? entry.close.trim()
            : null;

        return {
          day,
          open: closed ? null : open,
          close: closed ? null : close,
          closed,
        };
      })
      .filter(
        (
          item,
        ): item is {
          day: string;
          open: string | null;
          close: string | null;
          closed: boolean;
        } => Boolean(item),
      );
  }

  private getOpeningHoursForDate(dateIso: string, raw: unknown) {
    const date = new Date(`${dateIso}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;

    const labels = [
      'Dimanche',
      'Lundi',
      'Mardi',
      'Mercredi',
      'Jeudi',
      'Vendredi',
      'Samedi',
    ];

    return (
      this.normalizeOpeningHours(raw).find(
        (item) => item.day === labels[date.getUTCDay()],
      ) ?? null
    );
  }

  private computeGeoRank(
    salon: { city: string | null; country: string | null },
    preferredCity?: string,
    preferredCountry?: string,
  ) {
    const normalizedCity = preferredCity?.trim().toLowerCase();
    const normalizedCountry = preferredCountry?.trim().toLowerCase();
    const salonCity = salon.city?.trim().toLowerCase();
    const salonCountry = salon.country?.trim().toLowerCase();

    if (normalizedCity && salonCity === normalizedCity) return 0;
    if (normalizedCountry && salonCountry === normalizedCountry) return 1;
    return 2;
  }

  private estimateRating(completedCount: number) {
    if (completedCount >= 50) return 4.9;
    if (completedCount >= 20) return 4.8;
    if (completedCount >= 10) return 4.7;
    return 4.5;
  }

  private computeAverageRating(reviews: Array<{ rating: number }>) {
    if (!reviews.length) return 0;
    return Number(
      (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1),
    );
  }

  private toCategoryFromEnum(category: ServiceCategory) {
    switch (category) {
      case ServiceCategory.HAIR:
      case ServiceCategory.BARBER:
        return 'Coiffure';
      case ServiceCategory.NAILS:
        return 'Manucure/Pedicure';
      case ServiceCategory.FACE:
        return 'Soin du visage';
      case ServiceCategory.BODY:
        return 'Massage';
      case ServiceCategory.FITNESS:
        return 'Fitness';
      case ServiceCategory.OTHER:
      default:
        return 'Autres';
    }
  }

  private toCategory(name: string) {
    const n = name.toLowerCase();
    if (n.includes('coiff') || n.includes('lissage') || n.includes('brushing'))
      return 'Coiffure';
    if (n.includes('mass')) return 'Massage';
    if (n.includes('ongl') || n.includes('manuc') || n.includes('pedic'))
      return 'Manucure/Pedicure';
    if (n.includes('maquill') || n.includes('visage') || n.includes('skin'))
      return 'Soin du visage';
    return 'Autres';
  }

  private parseCoordinates(latitude?: string, longitude?: string) {
    const lat = latitude ? Number(latitude) : NaN;
    const lng = longitude ? Number(longitude) : NaN;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { latitude: lat, longitude: lng };
  }

  private resolveSalonCoordinates(salon: {
    address?: string | null;
    city: string | null;
    country: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Coordinates | null {
    if (
      typeof salon.latitude === 'number' &&
      Number.isFinite(salon.latitude) &&
      typeof salon.longitude === 'number' &&
      Number.isFinite(salon.longitude)
    ) {
      return {
        latitude: salon.latitude,
        longitude: salon.longitude,
      };
    }

    const key = `${salon.city ?? ''}|${salon.country ?? ''}`
      .trim()
      .toLowerCase();

    const knownCityCoordinates: Record<string, Coordinates> = {
      'libreville|gabon': { latitude: 0.4162, longitude: 9.4673 },
      'lambarene|gabon': { latitude: -0.7001, longitude: 10.2406 },
      'port-gentil|gabon': { latitude: -0.7193, longitude: 8.7815 },
      'port gentil|gabon': { latitude: -0.7193, longitude: 8.7815 },
      'franceville|gabon': { latitude: -1.6333, longitude: 13.5836 },
      'owendo|gabon': { latitude: 0.3009, longitude: 9.4896 },
      'akanda|gabon': { latitude: 0.5667, longitude: 9.55 },
    };

    return knownCityCoordinates[key] ?? null;
  }

  private computeDistanceKm(
    from: Coordinates | null,
    to: Coordinates | null,
  ): number | null {
    if (!from || !to) return null;

    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.latitude - from.latitude);
    const dLng = toRadians(to.longitude - from.longitude);
    const lat1 = toRadians(from.latitude);
    const lat2 = toRadians(to.latitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number((earthRadiusKm * c).toFixed(1));
  }
}

