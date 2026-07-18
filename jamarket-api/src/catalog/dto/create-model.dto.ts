import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateModelDto {
  @ApiProperty({
    description: 'Nom du modèle',
    example: 'Clio',
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du modèle est obligatoire' })
  @MaxLength(80, { message: 'Le nom du modèle ne peut pas dépasser 80 caractères' })
  label: string;

  @ApiProperty({
    description: 'Identifiant de la marque parente',
    example: 1,
  })
  @IsInt({ message: "L'identifiant de la marque doit être un entier" })
  @IsPositive({ message: "L'identifiant de la marque doit être supérieur à 0" })
  brandId: number;
}
