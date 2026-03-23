import { ForbiddenException, Injectable, NotFoundException, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
@Injectable()
export class SalonServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSalon(user: any) {
    if (!user.salonId) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }
    return user.salonId;
  }

  findAll(user: any) {
    const salonId = this.ensureSalon(user);

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

  create(user: any, dto: CreateServiceDto) {
    const salonId = this.ensureSalon(user);

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
    const salonId = this.ensureSalon(user);

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
    const salonId = this.ensureSalon(user);

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
    const salonId = this.ensureSalon(user);

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
    const salonId = this.ensureSalon(user);

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