import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVehiculeTypeDto {
  @ApiProperty({
    description: 'Libellé du type de véhicule (berline, SUV, utilitaire…)',
    example: 'Citadine',
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du type est obligatoire' })
  @MaxLength(80, {
    message: 'Le nom du type ne peut pas dépasser 80 caractères',
  })
  label: string;
}
