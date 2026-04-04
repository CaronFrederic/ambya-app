import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';

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