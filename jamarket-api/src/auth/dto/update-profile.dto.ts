import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nouveau prénom', example: 'Marie' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Nouveau nom de famille',
    example: 'Martin',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Nouveau mot de passe (minimum 8 caractères)',
    example: 'NouveauMotDePasse123',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @IsOptional()
  password?: string;
}
