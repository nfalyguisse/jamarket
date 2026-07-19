import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { FuelType } from '../../../generated/prisma/client';

export class CreateVehiculeDto {
  @ApiProperty({ description: 'Identifiant du modèle catalogue', example: 5 })
  @IsInt({ message: "L'identifiant du modèle doit être un entier" })
  @IsPositive()
  modelId: number;

  @ApiProperty({ description: 'Kilométrage actuel', example: 65000 })
  @IsInt()
  @Min(0, { message: 'Le kilométrage ne peut pas être négatif' })
  kilometer: number;

  @ApiProperty({ description: 'Année de mise en circulation', example: 2019 })
  @IsInt()
  @Min(1900, { message: "L'année doit être supérieure à 1900" })
  year: number;

  @ApiProperty({ description: 'Nombre de portes', example: 5 })
  @IsInt()
  @IsPositive({ message: 'Le nombre de portes doit être supérieur à 0' })
  doorsNumber: number;

  @ApiProperty({
    description: 'Puissance (libellé libre, ex. chevaux)',
    example: '110 ch',
  })
  @IsString()
  @IsNotEmpty({ message: 'La puissance est obligatoire' })
  power: string;

  @ApiProperty({
    description: 'Type de carburant',
    enum: FuelType,
    example: FuelType.diesel,
  })
  @IsEnum(FuelType, {
    message:
      'Type de carburant invalide (essence, diesel, electrique, hybride)',
  })
  fuel: FuelType;

  @ApiProperty({ description: 'Couleur du véhicule', example: 'blanc' })
  @IsString()
  @IsNotEmpty({ message: 'La couleur est obligatoire' })
  color: string;

  @ApiProperty({
    description: 'Identifiant du type de véhicule (berline, SUV…)',
    example: 1,
  })
  @IsInt({ message: "L'identifiant du type de véhicule doit être un entier" })
  @IsPositive()
  vehiculeTypeId: number;

  @ApiPropertyOptional({
    description:
      'URLs d’images déjà hébergées (optionnel si upload multipart ensuite)',
    type: [String],
    example: ['https://cdn.example.com/vehicules/1.webp'],
  })
  @IsArray()
  @IsUrl({}, { each: true, message: 'Chaque URL image doit être valide' })
  @IsOptional()
  imageUrls?: string[];
}
