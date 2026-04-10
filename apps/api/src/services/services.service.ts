import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class SalonServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSalon(user: any) {
    if (!user?.sub) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const salon = await this.prisma.salon.findFirst({
      where: {
        ownerId: user.sub,
      },
      select: {
        id: true,
      },
    });

    if (!salon) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(user: any, dto: CreateServiceDto) {
    const salonId = await this.ensureSalon(user);

    return this.prisma.service.create({
      data: {
        salonId,
        ...dto,
        isActive: true,
        status: 'ACTIVE',
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

    return this.prisma.service.update({
      where: { id },
      data: dto,
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
        status: 'INACTIVE',
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
        status: 'ACTIVE',
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
        status: 'ARCHIVED',
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}