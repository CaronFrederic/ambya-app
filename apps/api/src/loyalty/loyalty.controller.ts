import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtUser } from "../auth/decorators/current-user.decorator";
import { LoyaltyService } from "./loyalty.service";
import { UpdateLoyaltyConfigDto } from "./dto/update-loyalty-config.dto";

@Controller("pro/loyalty")
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  getConfig(@CurrentUser() user: JwtUser) {
    return this.loyaltyService.getConfig(user);
  }

  @Put()
  updateConfig(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateLoyaltyConfigDto,
  ) {
    return this.loyaltyService.updateConfig(user, dto);
  }

  @Get("stats")
  getStats(@CurrentUser() user: JwtUser) {
    return this.loyaltyService.getStats(user);
  }

  @Get("clients")
  getClients(@CurrentUser() user: JwtUser) {
    return this.loyaltyService.getClients(user);
  }
}