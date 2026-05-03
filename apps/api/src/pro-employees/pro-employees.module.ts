import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ProEmployeesController } from './pro-employees.controller'
import { ProEmployeesService } from './pro-employees.service'

@Module({
  imports: [PrismaModule],
  controllers: [ProEmployeesController],
  providers: [ProEmployeesService],
  exports: [ProEmployeesService],
})
export class ProEmployeesModule {}
