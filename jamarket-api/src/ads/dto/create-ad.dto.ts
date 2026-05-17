import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateAdDto {
  @IsString()
  @IsNotEmpty({ message: "Le titre de l'annonce est obligatoire" })
  label: string;

  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire' })
  description: string;

  @IsNumber()
  @IsPositive({ message: 'Le prix doit être supérieur à 0' })
  price: number;

  @IsInt({ message: "L'identifiant du véhicule doit être un entier" })
  @IsPositive({ message: "L'identifiant du véhicule doit être supérieur à 0" })
  vehiculeId: number;
}
