import { Module } from '@nestjs/common';
import { SalonsController } from './salon.controller';

import { SalonsService } from './salon.service';
@Module({
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}