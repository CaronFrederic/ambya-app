import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { MarkAbsenceDto } from './dto/mark-absence.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProEmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSalon(user: any) {
    if (!user?.salonId) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }
    return user.salonId;
  }

  findAll(user: any) {
    const salonId = this.ensureSalon(user);

    return this.prisma.employee.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: any, dto: CreateEmployeeDto) {
    const salonId = this.ensureSalon(user);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.email) {
          const existingUserByEmail = await tx.user.findUnique({
            where: { email: dto.email },
            select: { id: true },
          });

          if (existingUserByEmail) {
            throw new BadRequestException('Email déjà utilisé');
          }
        }

        if (dto.phone) {
          const existingUserByPhone = await tx.user.findUnique({
            where: { phone: dto.phone },
            select: { id: true },
          });

          if (existingUserByPhone) {
            throw new BadRequestException('Téléphone déjà utilisé');
          }
        }

        const tempUser = await tx.user.create({
          data: {
            email: dto.email ?? null,
            phone: dto.phone ?? null,
            password: null,
            role: 'EMPLOYEE',
            isActive: true,
          },
        });

        return tx.employee.create({
          data: {
            salonId,
            userId: tempUser.id,
            displayName: dto.displayName,
            firstName: dto.firstName ?? null,
            lastName: dto.lastName ?? null,
            roleLabel: dto.roleLabel ?? null,
            photoUrl: dto.photoUrl ?? null,
            phone: dto.phone ?? null,
            email: dto.email ?? null,
            isActive: true,
            status: 'ACTIVE',
          },
        });
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email ou téléphone déjà utilisé');
      }

      throw error;
    }
  }

  async update(user: any, id: string, dto: UpdateEmployeeDto) {
    const salonId = this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: { id, salonId },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    return this.prisma.employee.update({
      where: { id },
      data: dto,
    });
  }

  async remove(user: any, id: string) {
    const salonId = this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: { id, salonId },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
        status: 'INACTIVE',
      },
    });
  }

  async markAbsent(user: any, id: string, dto: MarkAbsenceDto) {
    const salonId = this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: { id, salonId },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    await this.prisma.employee.update({
      where: { id },
      data: { status: 'ABSENT' },
    });

    return this.prisma.employeeAbsence.create({
      data: {
        salonId,
        employeeId: id,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        source: 'MANUAL',
        createdById: user.sub,
      },
    });
  }

  async markActive(user: any, id: string) {
    const salonId = this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: { id, salonId },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    return this.prisma.employee.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }
}
