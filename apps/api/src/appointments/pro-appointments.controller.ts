import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { Param, Patch } from '@nestjs/common';
@Controller('pro/appointments')
@UseGuards(JwtAuthGuard)
export class ProAppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get('calendar')
  getCalendar(
    @CurrentUser() user: JwtUser,
    @Query('date') date?: string,
  ) {
    return this.service.getProCalendar(user, date);
  }

  @Patch(':id/confirm')
confirm(
  @CurrentUser() user: JwtUser,
  @Param('id') id: string,
) {
  return this.service.confirmAppointment(user, id);
}

@Patch(':id/reject')
reject(
  @CurrentUser() user: JwtUser,
  @Param('id') id: string,
) {
  return this.service.rejectAppointment(user, id);
}

  @Get('pending')
  getPending(
    @CurrentUser() user: JwtUser,
    @Query('date') date?: string,
  ) {
    return this.service.getProPendingRequests(user, date);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: string,
  ) {
    return this.service.getProHistory(user, status);
  }
}