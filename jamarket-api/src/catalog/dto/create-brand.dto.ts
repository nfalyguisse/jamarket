import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Nom de la marque automobile',
    example: 'Renault',
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la marque est obligatoire' })
  @MaxLength(80, {
    message: 'Le nom de la marque ne peut pas dépasser 80 caractères',
  })
  label: string;
}
