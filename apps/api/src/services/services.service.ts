import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ServiceCategory, ServiceStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

@Injectable()
export class SalonServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSalon(user: any) {
    const userId = user?.sub ?? user?.userId

    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié')
    }

    const salon = await this.prisma.salon.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    })

    if (!salon) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur')
    }

    return salon.id
  }

  async findAll(user: any) {
    const salonId = await this.ensureSalon(user)

    return this.prisma.service.findMany({
      where: {
        salonId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(user: any, dto: CreateServiceDto) {
    const salonId = await this.ensureSalon(user)

    return this.prisma.service.create({
      data: {
        salonId,
        name: dto.name,
        description: dto.description ?? undefined,
        category: this.mapServiceCategory(dto.category),
        price: dto.price,
        durationMin: dto.durationMin,
        isActive: true,
        status: ServiceStatus.ACTIVE,
      },
    })
  }

  async update(user: any, id: string, dto: UpdateServiceDto) {
    const salonId = await this.ensureSalon(user)

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    })

    if (!service) {
      throw new NotFoundException('Service introuvable')
    }

    const data: any = {
      ...dto,
    }

    if (dto.category !== undefined) {
      data.category = this.mapServiceCategory(dto.category)
    }

    return this.prisma.service.update({
      where: { id },
      data,
    })
  }

  async deactivate(user: any, id: string) {
    const salonId = await this.ensureSalon(user)

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    })

    if (!service) {
      throw new NotFoundException('Service introuvable')
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        isActive: false,
        status: ServiceStatus.INACTIVE,
      },
    })
  }

  async activate(user: any, id: string) {
    const salonId = await this.ensureSalon(user)

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    })

    if (!service) {
      throw new NotFoundException('Service introuvable')
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        isActive: true,
        status: ServiceStatus.ACTIVE,
      },
    })
  }

  async remove(user: any, id: string) {
    const salonId = await this.ensureSalon(user)

    const service = await this.prisma.service.findFirst({
      where: { id, salonId, deletedAt: null },
    })

    if (!service) {
      throw new NotFoundException('Service introuvable')
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        status: ServiceStatus.ARCHIVED,
        isActive: false,
        deletedAt: new Date(),
      },
    })
  }

 private mapServiceCategory(category?: string | null): ServiceCategory {
  if (!category) return ServiceCategory.OTHER

  const normalized = category.trim().toUpperCase()

  if (normalized in ServiceCategory) {
    return ServiceCategory[normalized as keyof typeof ServiceCategory]
  }

  if (category === 'beaute') return ServiceCategory.FACE
  if (category === 'bienetre') return ServiceCategory.BODY
  if (category === 'formation') return ServiceCategory.OTHER
  if (category === 'fitness') return ServiceCategory.FITNESS
  if (category === 'barbier') return ServiceCategory.BARBER
  if (category === 'onglerie') return ServiceCategory.NAILS
  if (category === 'massage') return ServiceCategory.BODY
  if (category === 'spa') return ServiceCategory.BODY
  if (category === 'salon-coiffure') return ServiceCategory.HAIR
  if (category === 'institut-beaute') return ServiceCategory.FACE

  return ServiceCategory.OTHER
}
}