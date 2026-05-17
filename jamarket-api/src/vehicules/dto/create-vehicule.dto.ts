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
  @IsInt({ message: "L'identifiant du modèle doit être un entier" })
  @IsPositive()
  modelId: number;

  @IsInt()
  @Min(0, { message: 'Le kilométrage ne peut pas être négatif' })
  kilometer: number;

  @IsInt()
  @Min(1900, { message: "L'année doit être supérieure à 1900" })
  year: number;

  @IsInt()
  @IsPositive({ message: 'Le nombre de portes doit être supérieur à 0' })
  doorsNumber: number;

  @IsString()
  @IsNotEmpty({ message: 'La puissance est obligatoire' })
  power: string;

  @IsEnum(FuelType, { message: 'Type de carburant invalide (essence, diesel, electrique, hybride)' })
  fuel: FuelType;

  @IsString()
  @IsNotEmpty({ message: 'La couleur est obligatoire' })
  color: string;

  @IsInt({ message: "L'identifiant du type de véhicule doit être un entier" })
  @IsPositive()
  vehiculeTypeId: number;

  @IsArray()
  @IsUrl({}, { each: true, message: 'Chaque URL image doit être valide' })
  @IsOptional()
  imageUrls?: string[];
}
