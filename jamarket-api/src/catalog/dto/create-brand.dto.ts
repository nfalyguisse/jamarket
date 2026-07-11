import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la marque est obligatoire' })
  @MaxLength(80, { message: 'Le nom de la marque ne peut pas dépasser 80 caractères' })
  label: string;
}
