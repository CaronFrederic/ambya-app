import { BadRequestException, Injectable, ForbiddenException, 
  NotFoundException  } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ListAppointmentsDto } from './dto/list-appointments.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { AssignEmployeeDto } from './dto/assign-employee.dto'
import { AppointmentStatus, UserRole } from '@prisma/client'

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(user: { userId: string; role: UserRole }, q: ListAppointmentsDto) {
    const where: any = {}

    if (user.role === 'CLIENT') {
      where.clientId = user.userId
    }

    if (user.role === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      })
      if (!employee) throw new ForbiddenException()
      where.employeeId = employee.id
    }

    if (user.role === 'PROFESSIONAL') {
      const salons = await this.prisma.salon.findMany({
        where: { ownerId: user.userId },
        select: { id: true },
      })
      where.salonId = { in: salons.map(s => s.id) }
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { startAt: 'desc' },
        skip: q.skip ?? 0,
        take: q.take ?? 20,
        include: {
        salon: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true, price: true } },
        employee: { select: { id: true, displayName: true } },
      },
      }),
      this.prisma.appointment.count({ where }),
    ])

    return { items, total }
  }

  async createForClient(
  user: { userId: string; role: UserRole },
  dto: CreateAppointmentDto,
) {
  if (user.role !== 'CLIENT') {
    throw new BadRequestException('Only CLIENT can create appointments')
  }

  const startAt = new Date(dto.startAt)
  if (Number.isNaN(startAt.getTime())) {
    throw new BadRequestException('Invalid startAt')
  }

  const service = await this.prisma.service.findFirst({
    where: { id: dto.serviceId, salonId: dto.salonId, isActive: true },
    select: { id: true, durationMin: true },
  })
  if (!service) {
    throw new BadRequestException('Service not found for this salon')
  }

  if (dto.employeeId) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, salonId: dto.salonId, isActive: true },
      select: { id: true },
    })
    if (!emp) throw new BadRequestException('Employee not found for this salon')
  }

  const endAt = new Date(startAt.getTime() + service.durationMin * 60_000)

  return this.prisma.appointment.create({
    data: {
      salonId: dto.salonId,
      serviceId: dto.serviceId,
      clientId: user.userId,
      employeeId: dto.employeeId ?? null,
      note: dto.note ?? null,
      startAt,
      endAt,
      status: AppointmentStatus.PENDING,
    },
    include: {
      salon: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, durationMin: true, price: true } },
      employee: { select: { id: true, displayName: true } },
    },
  })
}

async assignEmployee(
  user: { userId: string; role: UserRole },
  appointmentId: string,
  dto: AssignEmployeeDto,
) {
  // On récupère le RDV + salon ownerId pour check permissions
  const appt = await this.prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, salonId: true, clientId: true, employeeId: true, salon: { select: { ownerId: true } } },
  })
  if (!appt) throw new NotFoundException('Appointment not found')

  const isOwner = user.role === 'PROFESSIONAL' && appt.salon.ownerId === user.userId
  const isAdmin = user.role === 'ADMIN'
  const isClient = user.role === 'CLIENT' && appt.clientId === user.userId

  // MVP: autorise PRO owner + ADMIN (et optionnellement CLIENT si tu veux)
  if (!isOwner && !isAdmin && !isClient) {
    throw new ForbiddenException('Not allowed')
  }

  // Unassign
  if (!dto.employeeId) {
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { employeeId: null },
      include: {
        salon: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true, price: true } },
        employee: { select: { id: true, displayName: true } },
      },
    })
  }

  // Vérifie que l’employé existe et appartient au salon
  const emp = await this.prisma.employee.findFirst({
    where: { id: dto.employeeId, salonId: appt.salonId, isActive: true },
    select: { id: true },
  })
  if (!emp) throw new BadRequestException('Employee not found for this salon')

  return this.prisma.appointment.update({
    where: { id: appointmentId },
    data: { employeeId: dto.employeeId },
    include: {
      salon: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, durationMin: true, price: true } },
      employee: { select: { id: true, displayName: true } },
    },
  })
}


}
