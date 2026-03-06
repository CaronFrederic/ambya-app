import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomeQueryDto } from './dto/home-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { SalonAvailabilityQueryDto } from './dto/salon-availability-query.dto';

type Slot = {
  time: string;
  available: boolean;
};

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async home(query: HomeQueryDto) {
    const where: any = { isActive: true };
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.country)
      where.country = { contains: query.country, mode: 'insensitive' };

    const salons = await this.prisma.salon.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        services: {
          where: { isActive: true },
          select: { id: true, name: true, durationMin: true, price: true },
          orderBy: { price: 'asc' },
          take: 4,
        },
        appointments: {
          where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
          select: { id: true },
        },
      },
      take: 40,
    });

    const serviceCategories = await this.prisma.service.findMany({
      where: { isActive: true },
      select: { name: true },
      take: 500,
    });

    const categories = Array.from(
      new Set(serviceCategories.map((s) => this.toCategory(s.name))),
    );

    const filteredByCategory = query.category
      ? salons.filter((salon) =>
          salon.services.some(
            (service) => this.toCategory(service.name) === query.category,
          ),
        )
      : salons;

    const topRatedSalons = filteredByCategory
      .map((salon) => ({
        id: salon.id,
        name: salon.name,
        city: salon.city,
        country: salon.country,
        rating: this.estimateRating(salon.appointments.length),
        duration: salon.services[0]
          ? `${salon.services[0].durationMin} min`
          : '30 min',
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);

    const offers = filteredByCategory
      .filter((salon) => salon.services[0])
      .slice(0, 20)
      .map((salon, index) => {
        const service = salon.services[0]!;
        const discount = 10 + (index % 3) * 10;
        return {
          salonId: salon.id,
          salonName: salon.name,
          serviceId: service.id,
          serviceName: service.name,
          discountPercent: discount,
          originalPrice: service.price,
          discountedPrice: Math.round(service.price * (1 - discount / 100)),
        };
      });

    return {
      categories,
      offers,
      topRatedSalons,
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
      ];
    }

    const salons = await this.prisma.salon.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        services: {
          where: { isActive: true },
          select: { id: true, name: true, price: true, durationMin: true },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });

    const filtered = query.category
      ? salons.filter((salon) =>
          salon.services.some(
            (service) => this.toCategory(service.name) === query.category,
          ),
        )
      : salons;

    return {
      items: filtered.map((salon) => ({
        id: salon.id,
        name: salon.name,
        city: salon.city,
        country: salon.country,
        highlights: salon.services.map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMin: service.durationMin,
        })),
      })),
      total: filtered.length,
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
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            durationMin: true,
          },
          orderBy: { name: 'asc' },
        },
        employees: {
          where: { isActive: true },
          select: { id: true, displayName: true },
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
      const category = this.toCategory(service.name);
      if (!servicesByCategory[category]) servicesByCategory[category] = [];
      servicesByCategory[category].push(service);
    }

    const fallbackReviews = salon.appointments
      .slice(0, 8)
      .map((appointment, index) => ({
        id: appointment.id,
        author:
          appointment.client.clientProfile?.nickname ??
          appointment.client.email?.split('@')[0] ??
          'Client',
        rating: 5 - (index % 2),
        comment: 'Service apprécié, équipe professionnelle.',
        createdAt: appointment.createdAt,
      }));

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

    const reviews = explicitReviews.length ? explicitReviews : fallbackReviews;
    const averageRating = explicitReviews.length
      ? Number(
          (
            explicitReviews.reduce((sum, review) => sum + review.rating, 0) /
            explicitReviews.length
          ).toFixed(1),
        )
      : this.estimateRating(salon.appointments.length);

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
          : this.defaultGallery()[0],
      galleryImageUrls: Array.isArray(salon.galleryImageUrls)
        ? salon.galleryImageUrls.filter(
            (v): v is string => typeof v === 'string' && v.length > 0,
          )
        : this.defaultGallery(),
      socialLinks: this.normalizeSocialLinks(salon.socialLinks, salon.name),
      employees: salon.employees,
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
        employees: {
          where: { isActive: true },
          select: { id: true, displayName: true },
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
          select: { durationMin: true },
        })
      : [];

    const totalDurationMin =
      selectedServices.reduce((sum, service) => sum + service.durationMin, 0) ||
      30;

    const dayStart = new Date(`${query.date}T08:00:00.000Z`);
    const dayEnd = new Date(`${query.date}T18:00:00.000Z`);

    const appointments = await this.prisma.appointment.findMany({
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
    });

    const slots = this.generateSlots(dayStart, dayEnd, totalDurationMin);

    const professionals = salon.employees.map((employee) => {
      const employeeAppointments = appointments.filter(
        (appointment) => appointment.employeeId === employee.id,
      );
      const availability = slots.map((slot) => ({
        time: slot.time,
        available: !employeeAppointments.some((appointment) =>
          this.overlaps(
            slot.start,
            slot.end,
            appointment.startAt,
            appointment.endAt,
          ),
        ),
      }));

      return {
        id: employee.id,
        displayName: employee.displayName,
        slots: availability,
      };
    });

    const globalSlots: Slot[] = slots.map((slot) => {
      const available = professionals.some((professional) =>
        professional.slots.some((s) => s.time === slot.time && s.available),
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

  private defaultGallery() {
    return [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=700&q=80',
    ];
  }

  private normalizeSocialLinks(raw: unknown, salonName: string) {
    const fallback = this.defaultSocialLinks(salonName);

    if (!raw || typeof raw !== 'object') return fallback;

    const social = raw as Record<string, unknown>;
    return {
      instagram:
        typeof social.instagram === 'string' && social.instagram
          ? social.instagram
          : fallback.instagram,
      facebook:
        typeof social.facebook === 'string' && social.facebook
          ? social.facebook
          : fallback.facebook,
      tiktok:
        typeof social.tiktok === 'string' && social.tiktok
          ? social.tiktok
          : fallback.tiktok,
      website:
        typeof social.website === 'string' && social.website
          ? social.website
          : fallback.website,
    };
  }

  private defaultSocialLinks(salonName: string) {
    const slug =
      salonName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 20) || 'salon';
    return {
      instagram: `https://instagram.com/${slug}`,
      facebook: `https://facebook.com/${slug}`,
      tiktok: `https://tiktok.com/@${slug}`,
      website: `https://ambya.app/salons/${slug}`,
    };
  }

  private estimateRating(completedCount: number) {
    if (completedCount >= 50) return 4.9;
    if (completedCount >= 20) return 4.8;
    if (completedCount >= 10) return 4.7;
    return 4.5;
  }

  private toCategory(name: string) {
    const n = name.toLowerCase();
    if (n.includes('coiff') || n.includes('lissage') || n.includes('brushing'))
      return 'Coiffure';
    if (n.includes('mass')) return 'Massage';
    if (n.includes('ongl') || n.includes('manuc') || n.includes('pédic'))
      return 'Manucure/Pédicure';
    if (n.includes('maquill') || n.includes('visage') || n.includes('skin'))
      return 'Soin du visage';
    return 'Autres';
  }
}
