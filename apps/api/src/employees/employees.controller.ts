import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { MarkAbsenceDto } from './dto/mark-absence.dto';

@UseGuards(JwtAuthGuard)
@Controller('pro/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.employeesService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.employeesService.remove(user, id);
  }

  @Patch(':id/mark-absent')
  markAbsent(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: MarkAbsenceDto) {
    return this.employeesService.markAbsent(user, id, dto);
  }

  @Patch(':id/mark-active')
  markActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.employeesService.markActive(user, id);
  }
}