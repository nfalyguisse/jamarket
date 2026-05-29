import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsOptional()
  lastName?: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @IsOptional()
  password?: string;
}
