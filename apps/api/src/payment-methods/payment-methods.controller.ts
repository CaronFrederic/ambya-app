import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto'
import { PaymentMethodsService } from './payment-methods.service'

@Controller('me/payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.service.list(user.userId)
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePaymentMethodDto) {
    return this.service.create(user.userId, dto)
  }

  @Patch(':id/set-default')
  setDefault(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.service.setDefault(user.userId, id)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id)
  }
}
