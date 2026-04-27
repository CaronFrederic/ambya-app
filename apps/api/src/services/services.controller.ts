import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SalonServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@UseGuards(JwtAuthGuard)
@Controller('pro/services')
export class ServicesController {
  constructor(private readonly salonServicesService: SalonServicesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.salonServicesService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    return this.salonServicesService.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.salonServicesService.update(user, id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.salonServicesService.deactivate(user, id);
  }

  @Patch(':id/activate')
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.salonServicesService.activate(user, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.salonServicesService.remove(user, id);
  }
}