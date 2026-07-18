import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { FuelType } from '../../../generated/prisma/client';

export class FilterVehiculeDto {
  @ApiPropertyOptional({ description: 'Filtrer par marque', example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par modèle', example: 3 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  modelId?: number;

  @ApiPropertyOptional({ description: 'Carburant', enum: FuelType })
  @IsEnum(FuelType, { message: 'Type de carburant invalide' })
  @IsOptional()
  fuel?: FuelType;

  @ApiPropertyOptional({ description: 'Type de véhicule', example: 2 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  vehiculeTypeId?: number;

  @ApiPropertyOptional({ description: 'Kilométrage max', example: 100000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  kmMax?: number;

  @ApiPropertyOptional({ description: 'Année min', example: 2015 })
  @IsInt()
  @Min(1900)
  @IsOptional()
  @Type(() => Number)
  yearMin?: number;

  @ApiPropertyOptional({ description: 'Année max', example: 2024 })
  @IsInt()
  @Min(1900)
  @IsOptional()
  @Type(() => Number)
  yearMax?: number;

  @ApiPropertyOptional({ description: 'Page', example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite', example: 20 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
