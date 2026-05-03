import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { EmployeePortalController } from './employee-portal.controller'
import { EmployeePortalService } from './employee-portal.service'

@Module({
  imports: [PrismaModule],
  controllers: [EmployeePortalController],
  providers: [EmployeePortalService],
})
export class EmployeePortalModule {}
