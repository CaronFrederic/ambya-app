import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PaymentMethodsController } from './payment-methods.controller'
import { PaymentMethodsService } from './payment-methods.service'

@Module({
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService, PrismaService],
})
export class PaymentMethodsModule {}