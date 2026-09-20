import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountingReportsController } from './accounting-reports.controller';
import { AccountingReportsService } from './accounting-reports.service';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [AccountingReportsController],
  providers: [AccountingReportsService],
  exports: [AccountingReportsService],
})
export class AccountingReportsModule {}
