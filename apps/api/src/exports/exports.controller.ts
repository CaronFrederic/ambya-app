import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { ExportsService } from './exports.service';

@UseGuards(JwtAuthGuard)
@Controller('pro/exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('expenses')
  exportExpenses(@CurrentUser() user: JwtUser, @Query('month') month?: string) {
    return this.exportsService.exportExpenses(user, month);
  }

  @Get('appointments')
  exportAppointments(@CurrentUser() user: JwtUser, @Query('month') month?: string) {
    return this.exportsService.exportAppointments(user, month);
  }
}
