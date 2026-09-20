import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AccountingReportsService } from './accounting-reports.service';
import { GetAccountingReportDto } from './dto/get-accounting-report.dto';
import {
  CreateManualProductSaleDto,
  UpdateManualProductSaleDto,
} from './dto/manual-product-sale.dto';

@Controller('pro/accounting-reports')
@UseGuards(JwtAuthGuard)
export class AccountingReportsController {
  constructor(
    private readonly accountingReportsService: AccountingReportsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private assertAccess(user: JwtUser) {
    return this.subscriptionsService.assertFeatureAccess(
      user,
      'MANAGEMENT_REGISTER',
    );
  }

  @Get()
  async getReport(
    @CurrentUser() user: JwtUser,
    @Query() dto: GetAccountingReportDto,
  ) {
    await this.assertAccess(user);
    return this.accountingReportsService.generate(user, dto);
  }

  @Post('product-sales')
  async createProductSale(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateManualProductSaleDto,
  ) {
    await this.assertAccess(user);
    return this.accountingReportsService.createManualProductSale(user, dto);
  }

  @Patch('product-sales/:id')
  async updateProductSale(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateManualProductSaleDto,
  ) {
    await this.assertAccess(user);
    return this.accountingReportsService.updateManualProductSale(user, id, dto);
  }

  @Delete('product-sales/:id')
  async deleteProductSale(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    await this.assertAccess(user);
    return this.accountingReportsService.deleteManualProductSale(user, id);
  }

  @Get('export')
  async exportReport(
    @CurrentUser() user: JwtUser,
    @Query() dto: GetAccountingReportDto,
    @Res() response: Response,
  ) {
    await this.assertAccess(user);

    if (dto.format === 'pdf') {
      return this.accountingReportsService.exportPdf(user, dto, response);
    }

    if (dto.format === 'excel') {
      return this.accountingReportsService.exportExcel(user, dto, response);
    }

    return response.status(400).json({
      message: 'Le format doit être pdf ou excel.',
    });
  }
}
