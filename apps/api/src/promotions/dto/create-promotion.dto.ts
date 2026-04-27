import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePromotionDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(["percentage", "fixed"])
  type!: "percentage" | "fixed";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000000)
  value!: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  appliesToAllServices?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];
}