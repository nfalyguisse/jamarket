import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { FuelType } from '../../../generated/prisma/client';

export class FilterVehiculeDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  modelId?: number;

  @IsEnum(FuelType, { message: 'Type de carburant invalide' })
  @IsOptional()
  fuel?: FuelType;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  vehiculeTypeId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  kmMax?: number;

  @IsInt()
  @Min(1900)
  @IsOptional()
  @Type(() => Number)
  yearMin?: number;

  @IsInt()
  @Min(1900)
  @IsOptional()
  @Type(() => Number)
  yearMax?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
