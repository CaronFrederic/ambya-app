import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { SalonServicesService } from './services.service';
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [SalonServicesService],
  exports: [SalonServicesService],
})
export class ServicesModule {}