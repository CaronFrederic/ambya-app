import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';

@Controller('pro/appointments')
@UseGuards(JwtAuthGuard)
export class ProAppointmentsController {
  constructor(private readonly service: AppointmentsService) {console.log('✅ ProAppointmentsController loaded');}

  @Get('calendar')
  getCalendar(@CurrentUser() user: JwtUser, @Query('date') date?: string) {
    return this.service.getProCalendar(user, date);
  }

  @Get('pending')
  getPending(@CurrentUser() user: JwtUser, @Query('date') date?: string) {
    return this.service.getProPendingRequests(user, date);
  }

  @Get('history')
  getHistory(@CurrentUser() user: JwtUser, @Query('status') status?: string) {
    return this.service.getProHistory(user, status);
  }

  @Get('history/export')
  exportHistory(
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
    @Query('status') status?: string,
  ) {
    return this.service.exportProHistory(user, status, res);
  }

  @Get('history/:id')
  getHistoryDetails(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.service.getProHistoryDetails(user, id);
  }

  @Post('blocked-slots')
  createBlockedSlot(
    @CurrentUser() user: JwtUser,
    @Body()
    body: {
      date: string;
      startTime: string;
      endTime: string;
      reason?: string;
    },
  ) {
    return this.service.createProBlockedSlot(user, body);
  }

  @Patch(':id/confirm')
  confirm(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.service.confirmAppointment(user, id);
  }

  @Patch(':id/reject')
  reject(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.service.rejectAppointment(user, id);
  }
}