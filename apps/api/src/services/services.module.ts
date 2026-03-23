import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { SalonServicesService } from './services.service';

@Module({
  controllers: [ServicesController],
  providers: [SalonServicesService],
  exports: [SalonServicesService],
})
export class ServicesModule {}