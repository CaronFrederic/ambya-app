import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { EmployeeService } from './employee.service'
import { ListEmployeeScheduleQueryDto } from './dto/list-employee-schedule-query.dto'
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto'
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto'
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto'

@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: JwtUser) {
    return this.employeeService.getDashboard(user)
  }

  @Get('schedule-items')
  listScheduleItems(
    @CurrentUser() user: JwtUser,
    @Query() query: ListEmployeeScheduleQueryDto,
  ) {
    return this.employeeService.listScheduleItems(user, query)
  }

  @Get('schedule-items/:kind/:id')
  getScheduleItem(
    @CurrentUser() user: JwtUser,
    @Param('kind') kind: string,
    @Param('id') id: string,
  ) {
    return this.employeeService.getScheduleItemDetails(user, kind, id)
  }

  @Patch('schedule-items/:kind/:id/confirm')
  confirmScheduleItem(
    @CurrentUser() user: JwtUser,
    @Param('kind') kind: string,
    @Param('id') id: string,
  ) {
    return this.employeeService.confirmScheduleItem(user, kind, id)
  }

  @Patch('schedule-items/:kind/:id/complete')
  completeScheduleItem(
    @CurrentUser() user: JwtUser,
    @Param('kind') kind: string,
    @Param('id') id: string,
  ) {
    return this.employeeService.completeScheduleItem(user, kind, id)
  }

  @Patch('schedule-items/:kind/:id/pay')
  payScheduleItem(
    @CurrentUser() user: JwtUser,
    @Param('kind') kind: string,
    @Param('id') id: string,
  ) {
    return this.employeeService.payScheduleItem(user, kind, id)
  }

  @Get('available-slots')
  listAvailableSlots(@CurrentUser() user: JwtUser) {
    return this.employeeService.listAvailableSlots(user)
  }

  @Post('available-slots/:id/claim')
  claimAvailableSlot(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.employeeService.claimAvailableSlot(user, id)
  }

  @Post('blocked-slots')
  createBlockedSlot(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateBlockedSlotDto,
  ) {
    return this.employeeService.createBlockedSlot(user, dto)
  }

  @Get('leave-requests')
  listLeaveRequests(@CurrentUser() user: JwtUser) {
    return this.employeeService.listLeaveRequests(user)
  }

  @Post('leave-requests')
  createLeaveRequest(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.employeeService.createLeaveRequest(user, dto)
  }

  @Get('profile')
  getProfile(@CurrentUser() user: JwtUser) {
    return this.employeeService.getProfile(user)
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateEmployeeProfileDto,
  ) {
    return this.employeeService.updateProfile(user, dto)
  }
}
