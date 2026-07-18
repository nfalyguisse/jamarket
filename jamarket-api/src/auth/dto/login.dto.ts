import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Adresse email du compte',
    example: 'client@example.com',
  })
  @IsEmail({}, { message: "L'adresse email est invalide" })
  email: string;

  @ApiProperty({
    description: 'Mot de passe du compte',
    example: 'MotDePasse123',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  password: string;
}
