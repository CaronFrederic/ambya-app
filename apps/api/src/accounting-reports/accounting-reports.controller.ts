import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AccountingReportsService } from "./accounting-reports.service";
import { GetAccountingReportDto } from "./dto/get-accounting-report.dto";

@Controller("pro/accounting-reports")
@UseGuards(JwtAuthGuard)
export class AccountingReportsController {
  constructor(
    private readonly accountingReportsService: AccountingReportsService
  ) {}

  @Get()
  getReport(
    @CurrentUser() user: JwtUser,
    @Query() dto: GetAccountingReportDto
  ) {
    return this.accountingReportsService.generate(user, dto);
  }

  @Get("export")
  exportReport(
    @CurrentUser() user: JwtUser,
    @Query() dto: GetAccountingReportDto,
    @Res() response: Response
  ) {
    if (dto.format === "pdf") {
      return this.accountingReportsService.exportPdf(
        user,
        dto,
        response
      );
    }

    if (dto.format === "excel") {
      return this.accountingReportsService.exportExcel(
        user,
        dto,
        response
      );
    }

    return response.status(400).json({
      message: "Le format doit être pdf ou excel.",
    });
  }
}
