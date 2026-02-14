import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AppointmentsService } from './appointments.service'
import { ListAppointmentsDto } from './dto/list-appointments.dto'
import { Body, Post } from '@nestjs/common'
import { CreateAppointmentDto } from './dto/create-appointment.dto'

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  list(@Req() req: any, @Query() query: ListAppointmentsDto) {
    return this.service.listForUser(req.user, query)
  }

  @Post()
create(@Req() req: any, @Body() body: CreateAppointmentDto) {
  return this.service.createForClient(req.user, body)
}

}
