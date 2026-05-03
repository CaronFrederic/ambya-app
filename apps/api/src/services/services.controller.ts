import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { SalonServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@UseGuards(JwtAuthGuard)
@Controller('pro/services')
export class ServicesController {
  constructor(private readonly salonServicesService: SalonServicesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.salonServicesService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateServiceDto) {
    return this.salonServicesService.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.salonServicesService.update(user, id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.salonServicesService.deactivate(user, id);
  }

  @Patch(':id/activate')
  activate(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.salonServicesService.activate(user, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.salonServicesService.remove(user, id);
  }
}
