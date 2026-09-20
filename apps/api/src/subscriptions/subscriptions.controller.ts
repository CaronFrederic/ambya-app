import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('pro/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('plans')
  plans() {
    return this.subscriptions.getPlans();
  }

  @Get('current')
  current(@CurrentUser() user: JwtUser) {
    return this.subscriptions.getCurrent(user);
  }

  @Post('subscribe')
  subscribe(@CurrentUser() user: JwtUser, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptions.subscribe(user, dto);
  }

  @Post('cancel')
  cancel(@CurrentUser() user: JwtUser) {
    return this.subscriptions.cancel(user);
  }

  // TEMPORAIRE BÊTA : à supprimer lorsque le provider de paiement sera branché.
  @Post('payments/:id/confirm-beta')
  confirmBeta(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.subscriptions.confirmPaymentForBeta(user, id);
  }
}
