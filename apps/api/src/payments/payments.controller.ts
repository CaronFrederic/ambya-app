import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { UpdateIntentStatusDto } from './dto/update-intent-status.dto'
import { PaymentsService } from './payments.service'

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('intents')
  listMy(@CurrentUser() user: JwtUser) {
    return this.payments.listMyIntents(user.userId)
  }

  @Post('intents')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePaymentIntentDto) {
    return this.payments.createIntent(user.userId, dto)
  }

  @Patch('intents/:id/status')
  updateStatus(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateIntentStatusDto) {
    return this.payments.updateStatus({ userId: user.userId, role: user.role }, id, dto)
  }
}
