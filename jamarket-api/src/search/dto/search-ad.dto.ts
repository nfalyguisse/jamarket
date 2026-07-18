import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
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
  @ApiPropertyOptional({ description: 'Identifiant de la marque', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  brand?: number;

  @ApiPropertyOptional({ description: 'Identifiant du modèle', example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  model?: number;

  @ApiPropertyOptional({ description: 'Prix minimum (€)', example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Prix maximum (€)', example: 25000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Kilométrage exact (filtre legacy)', example: 80000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  mileage?: number;

  @ApiPropertyOptional({ description: 'Kilométrage minimum', example: 10000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  mileageMin?: number;

  @ApiPropertyOptional({
    description: 'Type de carburant',
    enum: FuelType,
    example: FuelType.essence,
  })
  @IsEnum(FuelType, { message: 'Type de carburant invalide' })
  @IsOptional()
  fuel?: FuelType;

  @ApiPropertyOptional({ description: 'Localisation / ville', example: 'Lyon' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Couleur du véhicule', example: 'gris' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Identifiant du type de véhicule', example: 2 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  vehiculeTypeId?: number;

  @ApiPropertyOptional({ description: 'Année minimum', example: 2015 })
  @IsInt()
  @Min(1900)
  @IsOptional()
  @Type(() => Number)
  yearMin?: number;

  @ApiPropertyOptional({ description: 'Année maximum', example: 2024 })
  @IsInt()
  @Min(1900)
  @IsOptional()
  @Type(() => Number)
  yearMax?: number;

  @ApiPropertyOptional({
    description: 'Recherche textuelle libre (titre, description…)',
    example: 'Clio',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: 'Critère de tri des résultats',
    enum: SearchSort,
    example: SearchSort.DATE_DESC,
  })
  @IsEnum(SearchSort, { message: 'Tri invalide' })
  @IsOptional()
  sort?: SearchSort;

  @ApiPropertyOptional({ description: 'Numéro de page (pagination)', example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page?: number;

  @ApiPropertyOptional({ description: 'Nombre d’éléments par page', example: 12, default: 12 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  limit?: number;

  /** Alias rétrocompatibilité */
  @ApiPropertyOptional({ description: 'Alias de brand (rétrocompatibilité)', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({ description: 'Alias de model (rétrocompatibilité)', example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  modelId?: number;

  @ApiPropertyOptional({ description: 'Kilométrage maximum (alias)', example: 120000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  kmMax?: number;
}
