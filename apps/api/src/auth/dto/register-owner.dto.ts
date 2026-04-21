import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class TimeSlotDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;
}

class DayScheduleDto {
  @IsBoolean()
  isOpen!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  slots!: TimeSlotDto[];
}

class GroupSettingsDto {
  @IsInt()
  @Min(1)
  maxCapacity!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  alertThreshold?: number;

  @IsString()
  cancellationPolicy!: string;

  @IsBoolean()
  waitingList!: boolean;
}

class RegisterOwnerServiceDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  duration!: string;

  @IsInt()
  @Min(1)
  price!: number;

  @IsString()
  @IsIn(["individual", "group"])
  type!: "individual" | "group";

  @IsOptional()
  @ValidateNested()
  @Type(() => GroupSettingsDto)
  groupSettings?: GroupSettingsDto;
}

export class RegisterOwnerDto {
  @IsString()
  @MinLength(3)
  establishmentName!: string;

  @IsString()
  establishmentType!: string;

  @IsOptional()
  @IsString()
  customType?: string;

  @IsArray()
  @ArrayMinSize(1)
  categories!: string[];

  @IsString()
  countryCode!: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @MinLength(10)
  address!: string;

  @IsString()
  city!: string;

  @IsString()
  district!: string;

  @IsOptional()
  @IsString()
  customDistrict?: string;

  @IsObject()
  schedule!: Record<string, DayScheduleDto>;

  @IsInt()
  @Min(1)
  teamSize!: number;

  @IsInt()
  @Min(1)
  workstations!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegisterOwnerServiceDto)
  services!: RegisterOwnerServiceDto[];

  @IsString()
  @IsIn(["phone", "email"])
  loginMethod!: "phone" | "email";

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsString()
  @IsIn(["mobile-money", "bank"])
  paymentMethod!: "mobile-money" | "bank";

  @IsOptional()
  @IsString()
  mobileMoneyOperator?: string;

  @IsOptional()
  @IsString()
  mobileMoneyNumber?: string;

  @IsBoolean()
  acceptTerms!: boolean;

  @IsBoolean()
  acceptNotifications!: boolean;

  @IsOptional()
  @IsBoolean()
  acceptNewsletter?: boolean;
}