import { IsIn, IsOptional, IsString, Matches } from "class-validator";

export class GetAccountingReportDto {
  @IsIn(["compte-resultat", "rapport-mensuel"])
  reportType!: "compte-resultat" | "rapport-mensuel";

  @IsIn(["Ce mois", "Mois dernier", "Cette année", "Personnalisé"])
  periodType!: "Ce mois" | "Mois dernier" | "Cette année" | "Personnalisé";

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}