import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { MarkAbsenceDto } from './dto/mark-absence.dto';

@Injectable()
export class EmployeesService {
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

  return this.prisma.employee.findMany({
    where: {
      salonId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

  async create(user: any, dto: CreateEmployeeDto) {
  const salonId = await this.ensureSalon(user);

  const tempUser = await this.prisma.user.create({
    data: {
      email: dto.email,
      phone: dto.phone,
      password: null,
      role: 'EMPLOYEE',
    },
  });

  return this.prisma.employee.create({
    data: {
      salonId,
      userId: tempUser.id,
      displayName: dto.displayName,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleLabel: dto.roleLabel,
      photoUrl: dto.photoUrl,
      phone: dto.phone,
      email: dto.email,
    },
  });
}

  async update(user: any, id: string, dto: UpdateEmployeeDto) {
  const salonId = await this.ensureSalon(user);

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
  const salonId = await this.ensureSalon(user);

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
  const salonId = await this.ensureSalon(user);

  const employee = await this.prisma.employee.findFirst({
    where: { id, salonId },
  });

  if (!employee) {
    throw new NotFoundException('Employé introuvable');
  }

  await this.prisma.employee.update({
    where: { id },
    data: {
      status: 'ABSENT',
    },
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
  const salonId = await this.ensureSalon(user);

  const employee = await this.prisma.employee.findFirst({
    where: { id, salonId },
  });

  if (!employee) {
    throw new NotFoundException('Employé introuvable');
  }

  return this.prisma.employee.update({
    where: { id },
    data: {
      status: 'ACTIVE',
    },
  });
}
}