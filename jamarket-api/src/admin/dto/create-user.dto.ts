import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Prénom', example: 'Paul' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  name: string;

  @ApiProperty({ description: 'Nom de famille', example: 'Bernard' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  lastName: string;

  @ApiProperty({
    description: 'Email unique du compte créé',
    example: 'paul.bernard@garage.fr',
  })
  @IsEmail({}, { message: "L'adresse email est invalide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @ApiProperty({
    description: 'Identifiant du rôle à assigner',
    example: 2,
  })
  @IsInt({ message: "L'identifiant du rôle doit être un entier" })
  @IsPositive({ message: "L'identifiant du rôle doit être supérieur à 0" })
  @Type(() => Number)
  roleId: number;
}
