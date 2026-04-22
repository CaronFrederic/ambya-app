import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtUser } from "../auth/decorators/current-user.decorator";
import { AccountingReportsService } from "./accounting-reports.service";
import { GetAccountingReportDto } from "./dto/get-accounting-report.dto";
import type { Response } from "express";

@Controller("pro/accounting-reports")
@UseGuards(JwtAuthGuard)
export class AccountingReportsController {
  constructor(
    private readonly accountingReportsService: AccountingReportsService,
  ) {}

  @Get()
  getReport(
    @CurrentUser() user: JwtUser,
    @Query() dto: GetAccountingReportDto,
  ) {
    return this.accountingReportsService.generate(user, dto);
  }

  @Get("export")
  exportReport(
    @CurrentUser() user: JwtUser,
    @Query() dto: GetAccountingReportDto,
    @Res() res: Response,
  ) {
    if (dto.format !== "excel") {
      return res.status(400).json({
        message: "Seul le format excel est supporté pour le moment",
      });
    }

    return this.accountingReportsService.exportExcel(user, dto, res);
  }
}