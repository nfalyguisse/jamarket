import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  lastName: string;

  @IsEmail({}, { message: "L'adresse email est invalide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;
}
