import { IsInt, Matches, Min } from "class-validator";

export class CreateManualProductSaleDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  saleDate!: string;
}

export class UpdateManualProductSaleDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  saleDate!: string;
}
