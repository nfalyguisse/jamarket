import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RightEnum } from '../../../generated/prisma/client';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'Le nom du rôle ne peut pas dépasser 80 caractères' })
  label?: string;

  @IsArray({ message: 'Les droits doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un droit doit être sélectionné' })
  @IsEnum(RightEnum, {
    each: true,
    message: 'Chaque droit doit être une valeur valide',
  })
  @IsOptional()
  rights?: RightEnum[];
}
