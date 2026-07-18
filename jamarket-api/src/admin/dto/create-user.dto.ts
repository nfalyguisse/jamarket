import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  lastName: string;

  @IsEmail({}, { message: "L'adresse email est invalide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsInt({ message: "L'identifiant du rôle doit être un entier" })
  @IsPositive({ message: "L'identifiant du rôle doit être supérieur à 0" })
  @Type(() => Number)
  roleId: number;
}
