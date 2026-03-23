import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { SalonsService } from './salon.service';

@UseGuards(JwtAuthGuard)
@Controller('pro/salon-settings')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get()
  getMySalon(@CurrentUser() user: any) {
    return this.salonsService.getMySalon(user);
  }

  @Put('info')
  updateMySalon(@CurrentUser() user: any, @Body() dto: UpdateSalonDto) {
    return this.salonsService.updateMySalon(user, dto);
  }
}