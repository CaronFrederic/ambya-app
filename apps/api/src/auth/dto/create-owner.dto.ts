import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TimeSlotDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;
}

export class DayScheduleDto {
  @IsBoolean()
  isOpen!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  slots!: TimeSlotDto[];
}

export class GroupSettingsDto {
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

export class OwnerServiceDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  duration!: string;

  @IsInt()
  @Min(1)
  price!: number;

  @IsOptional()
  @IsString()
  @IsIn(['individual', 'group'])
  type?: 'individual' | 'group';

  @IsOptional()
  @ValidateNested()
  @Type(() => GroupSettingsDto)
  groupSettings?: GroupSettingsDto;
}

export class CreateOwnerDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  confirmPassword?: string;

  @IsOptional()
  @IsString()
  salonName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  establishmentName?: string;

  @IsOptional()
  @IsString()
  establishmentType?: string;

  @IsOptional()
  @IsString()
  customType?: string;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  customDistrict?: string;

  @IsOptional()
  @IsObject()
  schedule?: Record<string, DayScheduleDto>;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamSize?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  workstations?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OwnerServiceDto)
  services?: OwnerServiceDto[];

  @IsOptional()
  @IsString()
  @IsIn(['phone', 'email'])
  loginMethod?: 'phone' | 'email';

  @IsOptional()
  @IsString()
  @IsIn(['mobile-money', 'bank'])
  paymentMethod?: 'mobile-money' | 'bank';

  @IsOptional()
  @IsString()
  @IsIn(['airtel', 'moov', 'mtn', 'orange'])
  mobileMoneyOperator?: 'airtel' | 'moov' | 'mtn' | 'orange';

  @IsOptional()
  @IsString()
  mobileMoneyNumber?: string;

  @IsOptional()
  @IsBoolean()
  depositEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(10)
  depositPercentage?: number;

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptNewsletter?: boolean;
}