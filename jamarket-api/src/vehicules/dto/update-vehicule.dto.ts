import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { FuelType } from '../../../generated/prisma/client';

export class UpdateVehiculeDto {
  @ApiPropertyOptional({ description: 'Identifiant du modèle', example: 5 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  modelId?: number;

  @ApiPropertyOptional({ description: 'Kilométrage', example: 70000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  kilometer?: number;

  @ApiPropertyOptional({ description: 'Année', example: 2019 })
  @IsInt()
  @Min(1900)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Nombre de portes', example: 5 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  doorsNumber?: number;

  @ApiPropertyOptional({ description: 'Puissance', example: '115 ch' })
  @IsString()
  @IsOptional()
  power?: string;

  @ApiPropertyOptional({ description: 'Carburant', enum: FuelType })
  @IsEnum(FuelType, { message: 'Type de carburant invalide' })
  @IsOptional()
  fuel?: FuelType;

  @ApiPropertyOptional({ description: 'Couleur', example: 'gris' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Type de véhicule', example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  vehiculeTypeId?: number;

  @ApiPropertyOptional({
    description: 'Remplacement des URLs d’images',
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true, message: 'Chaque URL image doit être valide' })
  @IsOptional()
  imageUrls?: string[];
}
