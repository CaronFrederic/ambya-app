import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtUser } from "../auth/decorators/current-user.decorator";
import { PromotionsService } from "./promotions.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

@Controller("pro/promotions")
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.promotionsService.list(user);
  }

  @Get("stats")
  stats(@CurrentUser() user: JwtUser) {
    return this.promotionsService.stats(user);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(user, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(user, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.promotionsService.remove(user, id);
  }
}