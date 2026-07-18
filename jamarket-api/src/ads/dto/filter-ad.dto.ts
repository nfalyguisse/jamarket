import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FuelType } from '../../../generated/prisma/client';

export class FilterAdDto {
  @ApiPropertyOptional({ description: 'Identifiant de la marque', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({ description: 'Identifiant du modèle', example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  modelId?: number;

  @ApiPropertyOptional({ description: 'Prix minimum (€)', example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Prix maximum (€)', example: 25000 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Kilométrage maximum', example: 120000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  kmMax?: number;

  @ApiPropertyOptional({ description: 'Type de carburant', enum: FuelType })
  @IsEnum(FuelType)
  @IsOptional()
  fuel?: FuelType;

  @ApiPropertyOptional({ description: 'Couleur', example: 'noir' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Identifiant du type de véhicule', example: 2 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  vehiculeTypeId?: number;

  @ApiPropertyOptional({ description: 'Page', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page?: number;

  @ApiPropertyOptional({ description: 'Limite par page', example: 12 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  limit?: number;
}
