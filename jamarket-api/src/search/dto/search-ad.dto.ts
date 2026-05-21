import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { FuelType } from '../../../generated/prisma/client';

export enum SearchSort {
  DATE_DESC = 'date_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  MILEAGE_ASC = 'mileage_asc',
  MILEAGE_DESC = 'mileage_desc',
}

export class SearchAdDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  brand?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  model?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  mileage?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  mileageMin?: number;

  @IsEnum(FuelType, { message: 'Type de carburant invalide' })
  @IsOptional()
  fuel?: FuelType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  vehiculeTypeId?: number;

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

  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(SearchSort, { message: 'Tri invalide' })
  @IsOptional()
  sort?: SearchSort;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  limit?: number;

  /** Alias rétrocompatibilité */
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  modelId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  kmMax?: number;
}
