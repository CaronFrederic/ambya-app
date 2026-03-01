import { Param, Patch, Body, Post, Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AppointmentsService } from './appointments.service'
import { ListAppointmentsDto } from './dto/list-appointments.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { AssignEmployeeDto } from './dto/assign-employee.dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { CancelAppointmentDto } from './dto/cancel-appointment.dto'

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

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.service.cancel(user, id, dto)
  }

}
