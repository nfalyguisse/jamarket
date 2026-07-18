import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeAdminPasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel du compte back-office',
    example: 'AncienMotDePasse123',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est obligatoire' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (minimum 8 caractères)',
    example: 'NouveauMotDePasse123',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;
}
