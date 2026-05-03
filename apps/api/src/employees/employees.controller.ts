import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { MarkAbsenceDto } from './dto/mark-absence.dto';

@UseGuards(JwtAuthGuard)
@Controller('pro/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.employeesService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.employeesService.remove(user, id);
  }

  @Patch(':id/mark-absent')
  markAbsent(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: MarkAbsenceDto) {
    return this.employeesService.markAbsent(user, id, dto);
  }

  @Patch(':id/mark-active')
  markActive(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.employeesService.markActive(user, id);
  }
}
