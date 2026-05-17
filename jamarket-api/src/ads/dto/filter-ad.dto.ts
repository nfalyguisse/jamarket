import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FuelType } from '../../../generated/prisma/client';

export class FilterAdDto {
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

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  kmMax?: number;

  @IsEnum(FuelType)
  @IsOptional()
  fuel?: FuelType;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  vehiculeTypeId?: number;

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
}
