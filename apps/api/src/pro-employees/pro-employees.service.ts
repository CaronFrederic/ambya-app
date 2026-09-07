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

  private async ensureSalon(user: any): Promise<string> {
    if (user?.salonId) {
      return user.salonId;
    }

    const userId = user?.userId ?? user?.sub;

    if (!userId) {
      throw new ForbiddenException('Utilisateur invalide');
    }

    const salon = await this.prisma.salon.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!salon) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }

    return salon.id;
  }

  // ========================
  // EMPLOYEES CRUD
  // ========================

  async findAll(user: any) {
    const salonId = await this.ensureSalon(user);

    // Un employé "supprimé" est conservé en base pour préserver
    // l'historique des rendez-vous/congés/absences, mais ne doit plus
    // apparaître dans la gestion de l'équipe.
    return this.prisma.employee.findMany({
      where: {
        salonId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: any, dto: CreateEmployeeDto) {
    const salonId = await this.ensureSalon(user);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.email) {
          const existing = await tx.user.findUnique({
            where: { email: dto.email },
          });
          if (existing) throw new BadRequestException('Email déjà utilisé');
        }

        if (dto.phone) {
          const existing = await tx.user.findUnique({
            where: { phone: dto.phone },
          });
          if (existing) throw new BadRequestException('Téléphone déjà utilisé');
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
    const salonId = await this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: {
        id,
        salonId,
        isActive: true,
      },
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
    const salonId = await this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: {
        id,
        salonId,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    // Soft delete : on conserve l'employé pour l'historique,
    // mais on le retire de l'équipe active et on désactive aussi
    // son compte utilisateur.
    return this.prisma.$transaction(async (tx) => {
      const deletedEmployee = await tx.employee.update({
        where: { id: employee.id },
        data: {
          isActive: false,
          status: 'INACTIVE',
        },
      });

      await tx.user.update({
        where: { id: employee.userId },
        data: {
          isActive: false,
        },
      });

      return deletedEmployee;
    });
  }

  async markAbsent(user: any, id: string, dto: MarkAbsenceDto) {
    const salonId = await this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: {
        id,
        salonId,
        isActive: true,
      },
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
        createdById: user.userId ?? user.sub,
      },
    });
  }

  async markActive(user: any, id: string) {
    const salonId = await this.ensureSalon(user);

    const employee = await this.prisma.employee.findFirst({
      where: {
        id,
        salonId,
        isActive: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    return this.prisma.employee.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  // ========================
  // LEAVE REQUESTS
  // ========================

  private mapLeaveRequest(request: any) {
    const publicStatus =
      request.status === 'APPROVED'
        ? 'ACCEPTED'
        : request.status === 'REJECTED'
          ? 'REFUSED'
          : request.status;

    return {
      id: request.id,
      employeeId: request.employeeId,
      employeeName: request.employee?.displayName ?? 'Employé',
      subject: request.subject ?? request.reason,
      reason: request.reason ?? null,
      startDate: request.startAt,
      endDate: request.endAt,
      requestDate: request.createdAt,
      status: publicStatus,
    };
  }

  async findLeaveRequests(user: any) {
    const salonId = await this.ensureSalon(user);

    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        employee: { salonId },
      },
      include: {
        employee: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((r) => this.mapLeaveRequest(r));
  }

  async respondLeaveRequest(
    user: any,
    id: string,
    status: 'ACCEPTED' | 'REFUSED',
  ) {
    const salonId = await this.ensureSalon(user);
    const userId = user.userId ?? user.sub;

    const request = await this.prisma.leaveRequest.findFirst({
      where: {
        id,
        employee: {
          salonId,
          isActive: true,
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    const canonicalStatus = status === 'ACCEPTED' ? 'APPROVED' : 'REJECTED';

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: canonicalStatus,
        reviewedById: userId,
        reviewedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (canonicalStatus === 'APPROVED') {
      await this.prisma.employee.update({
        where: { id: request.employeeId },
        data: { status: 'LEAVE' },
      });

      await this.prisma.employeeAbsence.create({
        data: {
          salonId,
          employeeId: request.employeeId,
          leaveRequestId: request.id,
          reason: request.reason,
          startDate: request.startAt,
          endDate: request.endAt,
          source: 'LEAVE_REQUEST',
          createdById: userId,
        },
      });
    }

    return this.mapLeaveRequest(updated);
  }
}