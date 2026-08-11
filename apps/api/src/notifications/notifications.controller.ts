import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.PROFESSIONAL, UserRole.SALON_MANAGER, UserRole.EMPLOYEE)
  list(@CurrentUser() user: JwtUser) {
    return this.service.listForUser(user);
  }

  @Get('summary')
  @Roles(UserRole.CLIENT, UserRole.PROFESSIONAL, UserRole.SALON_MANAGER, UserRole.EMPLOYEE)
  summary(@CurrentUser() user: JwtUser) {
    return this.service.summaryForUser(user);
  }

  @Patch(':id/read')
  @Roles(UserRole.CLIENT, UserRole.PROFESSIONAL, UserRole.SALON_MANAGER, UserRole.EMPLOYEE)
  markAsRead(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.service.markAsRead(user, id);
  }
}
