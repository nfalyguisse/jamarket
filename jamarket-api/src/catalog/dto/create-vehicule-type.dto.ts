import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVehiculeTypeDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du type est obligatoire' })
  @MaxLength(80, { message: 'Le nom du type ne peut pas dépasser 80 caractères' })
  label: string;
}
