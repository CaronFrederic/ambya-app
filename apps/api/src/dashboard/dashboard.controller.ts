import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtUser,
} from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('pro/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtUser) {
    // On privilégie ta version (plus propre)
    if (this.dashboardService.getProfessionalDashboardSummary) {
      return this.dashboardService.getProfessionalDashboardSummary({
        userId: user.userId,
        role: user.role,
      });
    }

    // fallback si collègue uniquement
    return this.dashboardService.getSummary(user);
  }

  @Get('recent-transactions')
  getRecentTransactions(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getRecentTransactions(user);
  }
}