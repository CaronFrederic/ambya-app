import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExportsService } from './exports.service';

@UseGuards(JwtAuthGuard)
@Controller('pro/exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('expenses')
  exportExpenses(@CurrentUser() user: any, @Query('month') month?: string) {
    return this.exportsService.exportExpenses(user, month);
  }

  @Get('appointments')
  exportAppointments(@CurrentUser() user: any, @Query('month') month?: string) {
    return this.exportsService.exportAppointments(user, month);
  }
}