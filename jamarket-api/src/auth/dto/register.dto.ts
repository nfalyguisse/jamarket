import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Prénom de l’acheteur', example: 'Marie' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  name: string;

  @ApiProperty({ description: 'Nom de famille de l’acheteur', example: 'Dupont' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  lastName: string;

  @ApiProperty({
    description: 'Adresse email unique du compte',
    example: 'marie.dupont@example.com',
  })
  @IsEmail({}, { message: "L'adresse email est invalide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @ApiProperty({
    description: 'Mot de passe (minimum 8 caractères)',
    example: 'MotDePasse123',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;
}
