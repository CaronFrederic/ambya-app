import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { MeService } from './me.service'
import { Body, Patch } from '@nestjs/common'
import { UpdateClientProfileDto } from './dto/update-client-profile.dto'

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  getMe(@CurrentUser() user: JwtUser) {
    return this.me.getMe(user.userId)
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateClientProfileDto) {
    return this.me.updateClientProfile(user.userId, dto)
  }

  @Get('loyalty')
  getLoyalty(@CurrentUser() user: JwtUser) {
    return this.me.getLoyalty(user.userId)
  }

  @Get('summary')
  getSummary(@CurrentUser() user: JwtUser) {
    return this.me.getSummary(user.userId)
  }
}