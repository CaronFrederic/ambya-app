import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSalonDto } from './dto/update-salon.dto';

@Injectable()
export class SalonsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMySalon(user: { sub: string; role: string; salonId?: string | null }) {
    if (!user.salonId) {
      throw new NotFoundException('Aucun salon lié à cet utilisateur');
    }

    const salon = await this.prisma.salon.findUnique({
      where: { id: user.salonId },
    });

    if (!salon) {
      throw new NotFoundException('Salon introuvable');
    }

    return salon;
  }

  async updateMySalon(
    user: { sub: string; role: string; salonId?: string | null },
    dto: UpdateSalonDto,
  ) {
    if (!user.salonId) {
      throw new NotFoundException('Aucun salon lié à cet utilisateur');
    }

    if (!['PROFESSIONAL', 'SALON_MANAGER', 'ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.salon.update({
      where: { id: user.salonId },
      data: dto,
    });
  }
}