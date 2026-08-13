import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateAdDto {
  @ApiProperty({
    description: 'Titre affiché de l’annonce',
    example: 'Renault Clio 1.5 dCi — 2019',
  })
  @IsString()
  @IsNotEmpty({ message: "Le titre de l'annonce est obligatoire" })
  label: string;

  @ApiProperty({
    description: 'Description commerciale détaillée',
    example:
      'Véhicule entretenu en garage, carnet à jour, premier propriétaire.',
  })
  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire' })
  description: string;

  @ApiProperty({ description: 'Prix de vente en euros', example: 12990 })
  @IsNumber()
  @IsPositive({ message: 'Le prix doit être supérieur à 0' })
  price: number;

  @ApiProperty({
    description: 'Identifiant du véhicule associé (fiche technique déjà créée)',
    example: 42,
  })
  @IsInt({ message: "L'identifiant du véhicule doit être un entier" })
  @IsPositive({ message: "L'identifiant du véhicule doit être supérieur à 0" })
  vehiculeId: number;

  @ApiPropertyOptional({
    description:
      'Publier immédiatement l’annonce (sinon brouillon / en attente selon le flux)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
