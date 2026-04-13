import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateLoyaltyConfigDto {
  @Type(() => Boolean)
  @IsBoolean()
  enabled!: boolean;

  @IsIn(["stamps", "points", "progressive"])
  cardType!: "stamps" | "points" | "progressive";

  @IsString()
  programName!: string;

  @IsOptional()
  @IsString()
  programDesc?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  stamps!: number;
}