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
  @IsInt()
  @IsPositive()
  @IsOptional()
  modelId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  kilometer?: number;

  @IsInt()
  @Min(1900)
  @IsOptional()
  year?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  doorsNumber?: number;

  @IsString()
  @IsOptional()
  power?: string;

  @IsEnum(FuelType, { message: 'Type de carburant invalide' })
  @IsOptional()
  fuel?: FuelType;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  vehiculeTypeId?: number;

  @IsArray()
  @IsUrl({}, { each: true, message: 'Chaque URL image doit être valide' })
  @IsOptional()
  imageUrls?: string[];
}
