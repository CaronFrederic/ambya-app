import { Param, Patch, Body, Post, Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AppointmentsService } from './appointments.service'
import { ListAppointmentsDto } from './dto/list-appointments.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { AssignEmployeeDto } from './dto/assign-employee.dto'

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

@Patch(':id/assign-employee')
assignEmployee(@Req() req: any, @Param('id') id: string, @Body() body: AssignEmployeeDto) {
  return this.service.assignEmployee(req.user, id, body)
}


}
