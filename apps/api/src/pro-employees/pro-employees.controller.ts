import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { ProEmployeesService } from './pro-employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { MarkAbsenceDto } from './dto/mark-absence.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@UseGuards(JwtAuthGuard)
@Controller('pro/employees')
export class ProEmployeesController {
  constructor(
    private readonly employeesService: ProEmployeesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private assertAccess(user: JwtUser) {
    return this.subscriptionsService.assertFeatureAccess(user, 'EMPLOYEES');
  }

  @Get()
  async findAll(@CurrentUser() user: JwtUser) {
    await this.assertAccess(user);
    return this.employeesService.findAll(user);
  }

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateEmployeeDto) {
    await this.assertAccess(user);
    return this.employeesService.create(user, dto);
  }

  @Get('leave-requests')
  async findLeaveRequests(@CurrentUser() user: JwtUser) {
    await this.assertAccess(user);
    return this.employeesService.findLeaveRequests(user);
  }

  @Patch('leave-requests/:id/accept')
  async acceptLeaveRequest(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.assertAccess(user);
    return this.employeesService.respondLeaveRequest(user, id, 'ACCEPTED');
  }

  @Patch('leave-requests/:id/refuse')
  async refuseLeaveRequest(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.assertAccess(user);
    return this.employeesService.respondLeaveRequest(user, id, 'REFUSED');
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    await this.assertAccess(user);
    return this.employeesService.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.assertAccess(user);
    return this.employeesService.remove(user, id);
  }

  @Patch(':id/mark-absent')
  async markAbsent(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: MarkAbsenceDto,
  ) {
    await this.assertAccess(user);
    return this.employeesService.markAbsent(user, id, dto);
  }

  @Patch(':id/mark-active')
  async markActive(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.assertAccess(user);
    return this.employeesService.markActive(user, id);
  }
}
