import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { SalonsController } from './salon.controller'
import { SalonsService } from './salon.service'

@Module({
  imports: [PrismaModule],
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}