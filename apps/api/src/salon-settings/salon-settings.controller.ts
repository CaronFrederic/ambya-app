import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { SalonSettingsService } from './salon-settings.service'
import { UpsertSalonSettingsDto } from './dto/upsert-salon-settings.dto'

@Controller('pro/salon-settings')
@UseGuards(JwtAuthGuard)
export class SalonSettingsController {
  constructor(private readonly salonSettingsService: SalonSettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: JwtUser) {
    return this.salonSettingsService.getSettings({
      userId: user.userId,
      role: user.role,
    })
  }

  @Put()
  updateSettings(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpsertSalonSettingsDto,
  ) {
    return this.salonSettingsService.upsertSettings({
      userId: user.userId,
      role: user.role,
    }, dto)
  }
}