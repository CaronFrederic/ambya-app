import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { SalonSettingsController } from './salon-settings.controller'
import { SalonSettingsService } from './salon-settings.service'

@Module({
  imports: [PrismaModule],
  controllers: [SalonSettingsController],
  providers: [SalonSettingsService],
  exports: [SalonSettingsService],
})
export class SalonSettingsModule {}