import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ListAppointmentsDto } from './dto/list-appointments.dto'
import { UserRole } from '@prisma/client'

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
          salon: { select: { name: true } },
          service: { select: { name: true, durationMin: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ])

    return { items, total }
  }
}
