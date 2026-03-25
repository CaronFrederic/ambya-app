import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AdminService } from './admin.service'
import { CreateAdminDto } from './dto/create-admin.dto'
import { UpdateAdminDto } from './dto/update-admin.dto'
import { ListUsersQueryDto } from './dto/list-users-query.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ListSalonsQueryDto } from './dto/list-salons-query.dto'
import { UpdateSalonDto } from './dto/update-salon.dto'
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto'
import { UpdateAppointmentDto } from './dto/update-appointment.dto'
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtUser) {
    return this.adminService.getDashboard(user)
  }

  @Get('admins')
  listAdmins(@CurrentUser() user: JwtUser) {
    return this.adminService.listAdmins(user)
  }

  @Post('admins')
  createAdmin(@CurrentUser() user: JwtUser, @Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(user, dto)
  }

  @Get('admins/:id')
  getAdmin(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.adminService.getAdmin(user, id)
  }

  @Patch('admins/:id')
  updateAdmin(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.updateAdmin(user, id, dto)
  }

  @Get('users')
  listUsers(@CurrentUser() user: JwtUser, @Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(user, query)
  }

  @Get('users/:id')
  getUser(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.adminService.getUser(user, id)
  }

  @Patch('users/:id')
  updateUser(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(user, id, dto)
  }

  @Get('salons')
  listSalons(@CurrentUser() user: JwtUser, @Query() query: ListSalonsQueryDto) {
    return this.adminService.listSalons(user, query)
  }

  @Get('salons/:id')
  getSalon(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.adminService.getSalon(user, id)
  }

  @Patch('salons/:id')
  updateSalon(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateSalonDto) {
    return this.adminService.updateSalon(user, id, dto)
  }

  @Get('appointments')
  listAppointments(@CurrentUser() user: JwtUser, @Query() query: ListAppointmentsQueryDto) {
    return this.adminService.listAppointments(user, query)
  }

  @Get('appointments/:id')
  getAppointment(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.adminService.getAppointment(user, id)
  }

  @Patch('appointments/:id')
  updateAppointment(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.adminService.updateAppointment(user, id, dto)
  }

  @Get('audit-logs')
  listAuditLogs(@CurrentUser() user: JwtUser, @Query() query: ListAuditLogsQueryDto) {
    return this.adminService.listAuditLogs(user, query)
  }
}
