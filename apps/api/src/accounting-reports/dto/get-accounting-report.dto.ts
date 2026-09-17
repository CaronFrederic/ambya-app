import { IsIn, IsOptional, IsString, Matches } from "class-validator";

export class GetAccountingReportDto {
  @IsIn(["Ce mois", "Trimestre", "Année", "Choisir"])
  periodType!: "Ce mois" | "Trimestre" | "Année" | "Choisir";

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;

  @IsOptional()
  @IsIn(["pdf", "excel"])
  format?: "pdf" | "excel";
}
