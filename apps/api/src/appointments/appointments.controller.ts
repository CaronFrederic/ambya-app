import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AppointmentsService } from './appointments.service'
import { ListAppointmentsDto } from './dto/list-appointments.dto'

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  list(@Req() req: any, @Query() query: ListAppointmentsDto) {
    return this.service.listForUser(req.user, query)
  }
}
