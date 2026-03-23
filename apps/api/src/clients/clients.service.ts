import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientNoteDto } from './dto/update-client-note.dto';
import { UpdateDepositExemptDto } from './dto/update-deposit-exempt.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSalon(user: any) {
    if (!user?.salonId) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }
    return user.salonId as string;
  }

  async findAll(user: any, query: ListClientsDto) {
    const salonId = this.ensureSalon(user);

    return this.prisma.salonClient.findMany({
      where: {
        salonId,
        ...(query.search
          ? {
              client: {
                OR: [
                  { email: { contains: query.search, mode: 'insensitive' } },
                  { phone: { contains: query.search } },
                ],
              },
            }
          : {}),
      },
      include: {
        client: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(user: any, id: string) {
    const salonId = this.ensureSalon(user);

    const salonClient = await this.prisma.salonClient.findFirst({
      where: {
        id,
        salonId,
      },
      include: {
        client: true,
        notes: {
          orderBy: { updatedAt: 'desc' },
        },
        appointments: {
          include: {
            employee: true,
            service: true,
          },
          orderBy: {
            startAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    return salonClient;
  }

  async updateDepositExempt(
    user: any,
    id: string,
    dto: UpdateDepositExemptDto,
  ) {
    const salonId = this.ensureSalon(user);

    const salonClient = await this.prisma.salonClient.findFirst({
      where: { id, salonId },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    return this.prisma.salonClient.update({
      where: { id },
      data: {
        isDepositExempt: dto.isDepositExempt,
      },
    });
  }

  async upsertNote(user: any, id: string, dto: UpdateClientNoteDto) {
    const salonId = this.ensureSalon(user);

    const salonClient = await this.prisma.salonClient.findFirst({
      where: { id, salonId },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    const existing = await this.prisma.clientNote.findFirst({
      where: {
        salonId,
        salonClientId: id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (existing) {
      return this.prisma.clientNote.update({
        where: { id: existing.id },
        data: {
          content: dto.content,
          updatedById: user.sub,
        },
      });
    }

    return this.prisma.clientNote.create({
      data: {
        salonId,
        salonClientId: id,
        content: dto.content,
        createdById: user.sub,
        updatedById: user.sub,
      },
    });
  }

  async blockClient(user: any, id: string) {
    const salonId = this.ensureSalon(user);

    const salonClient = await this.prisma.salonClient.findFirst({
      where: { id, salonId },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    return this.prisma.salonClient.update({
      where: { id },
      data: {
        isBlocked: true,
      },
    });
  }
}