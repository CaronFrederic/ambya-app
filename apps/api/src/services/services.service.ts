import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceCategory, ServiceStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class SalonServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSalon(user: any) {
    const userId = user?.sub ?? user?.userId;

    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const salon = await this.prisma.salon.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!salon) {
      throw new ForbiddenException(
        'Salon introuvable pour cet utilisateur',
      );
    }

    return salon.id;
  }

  async findAll(user: any) {
    const salonId = await this.ensureSalon(user);

    return this.prisma.service.findMany({
      where: {
        salonId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: any, dto: CreateServiceDto) {
    const salonId = await this.ensureSalon(user);
    const category = this.mapServiceCategory(dto.category);
    const customCategory = this.resolveCustomCategory(
      dto.category,
      dto.customCategory,
      category,
    );

    return this.prisma.service.create({
      data: {
        salonId,
        name: dto.name.trim(),
        description: dto.description?.trim() || undefined,
        category,
        customCategory,
        price: dto.price,
        durationMin: dto.durationMin,
        isActive: true,
        status: ServiceStatus.ACTIVE,
      },
    });
  }

  async update(user: any, id: string, dto: UpdateServiceDto) {
    const salonId = await this.ensureSalon(user);

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable');
    }

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    if (dto.price !== undefined) {
      data.price = dto.price;
    }

    if (dto.durationMin !== undefined) {
      data.durationMin = dto.durationMin;
    }

    if (dto.category !== undefined) {
      const category = this.mapServiceCategory(dto.category);

      data.category = category;
      data.customCategory = this.resolveCustomCategory(
        dto.category,
        dto.customCategory,
        category,
      );
    } else if (dto.customCategory !== undefined) {
      if (service.category !== ServiceCategory.OTHER) {
        throw new BadRequestException(
          'Une catégorie personnalisée ne peut être utilisée qu’avec la catégorie Autre.',
        );
      }

      const customCategory = dto.customCategory.trim();

      if (!customCategory) {
        throw new BadRequestException(
          'Veuillez préciser la catégorie personnalisée.',
        );
      }

      data.customCategory = customCategory;
    }

    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async deactivate(user: any, id: string) {
    const salonId = await this.ensureSalon(user);

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        isActive: false,
        status: ServiceStatus.INACTIVE,
      },
    });
  }

  async activate(user: any, id: string) {
    const salonId = await this.ensureSalon(user);

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        isActive: true,
        status: ServiceStatus.ACTIVE,
      },
    });
  }

  async remove(user: any, id: string) {
    const salonId = await this.ensureSalon(user);

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        status: ServiceStatus.ARCHIVED,
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  private mapServiceCategory(
    category?: string | null,
  ): ServiceCategory {
    if (!category?.trim()) {
      return ServiceCategory.OTHER;
    }

    const normalized = category
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    switch (normalized) {
      case 'hair':
      case 'coiffure':
      case 'salon-coiffure':
        return ServiceCategory.HAIR;

      case 'barber':
      case 'barbier':
        return ServiceCategory.BARBER;

      case 'body':
      case 'massage':
      case 'spa':
      case 'bienetre':
        return ServiceCategory.BODY;

      case 'nails':
      case 'manucure':
      case 'pedicure':
      case 'onglerie':
        return ServiceCategory.NAILS;

      case 'face':
      case 'makeup':
      case 'maquillage':
      case 'beaute':
      case 'institut-beaute':
        return ServiceCategory.FACE;

      case 'fitness':
        return ServiceCategory.FITNESS;

      case 'other':
      case 'autre':
      case 'formation':
        return ServiceCategory.OTHER;

      default:
        return ServiceCategory.OTHER;
    }
  }

  private resolveCustomCategory(
    rawCategory: string | null | undefined,
    customCategory: string | null | undefined,
    mappedCategory: ServiceCategory,
  ): string | null {
    if (mappedCategory !== ServiceCategory.OTHER) {
      return null;
    }

    const custom = customCategory?.trim();

    if (custom) {
      return custom;
    }

    const raw = rawCategory?.trim();

    if (
      raw &&
      !['autre', 'other', 'formation'].includes(
        raw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      )
    ) {
      return raw;
    }

    throw new BadRequestException(
      'Veuillez préciser la catégorie personnalisée.',
    );
  }
}