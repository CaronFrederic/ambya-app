import { Param, Patch, Body, Post, Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AppointmentsService } from './appointments.service'
import { ListAppointmentsDto } from './dto/list-appointments.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { AssignEmployeeDto } from './dto/assign-employee.dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { CancelAppointmentDto } from './dto/cancel-appointment.dto'
import { CreateAppointmentsFromCartDto } from './dto/create-appointments-from-cart.dto'
import { UpdateAppointmentGroupDto } from './dto/update-appointment-group.dto'
import { CreateReviewDto } from './dto/create-review.dto'

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

  @Post('from-cart')
  createFromCart(@CurrentUser() user: JwtUser, @Body() body: CreateAppointmentsFromCartDto) {
    return this.service.createFromCart(user, body)
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

  @Get('group/:groupId')
  groupDetails(@CurrentUser() user: JwtUser, @Param('groupId') groupId: string) {
    return this.service.groupDetails(user, groupId)
  }

  @Patch('group/:groupId')
  updateGroup(
    @CurrentUser() user: JwtUser,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateAppointmentGroupDto,
  ) {
    return this.service.updateGroup(user, groupId, dto)
  }

  @Patch('group/:groupId/cancel')
  cancelGroup(
    @CurrentUser() user: JwtUser,
    @Param('groupId') groupId: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.service.cancelGroup(user, groupId, dto)
  }

  @Post('group/:groupId/review')
  createReview(
    @CurrentUser() user: JwtUser,
    @Param('groupId') groupId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.service.createGroupReview(user, groupId, dto)
  }
  @Get('pro/calendar')
getProCalendar(
  @CurrentUser() user: JwtUser,
  @Query('date') date?: string,
) {
  return this.service.getProCalendar(user, date);
}

@Get('pro/pending')
getProPending(
  @CurrentUser() user: JwtUser,
  @Query('date') date?: string,
) {
  return this.service.getProPendingRequests(user, date);
}

@Get('pro/history')
getProHistory(
  @CurrentUser() user: JwtUser,
  @Query('status') status?: string,
) {
  return this.service.getProHistory(user, status);
}

@Patch('pro/:id/confirm')
confirm(
  @CurrentUser() user: JwtUser,
  @Param('id') id: string,
) {
  return this.service.confirmAppointment(user, id);
}

@Patch('pro/:id/reject')
reject(
  @CurrentUser() user: JwtUser,
  @Param('id') id: string,
) {
  return this.service.rejectAppointment(user, id);
}
}
