import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RightEnum } from '../../../generated/prisma/client';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Libellé du rôle',
    example: 'Vendeur garage',
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du rôle est obligatoire' })
  @MaxLength(80, { message: 'Le nom du rôle ne peut pas dépasser 80 caractères' })
  label: string;

  @ApiProperty({
    description: 'Liste des droits accordés à ce rôle',
    enum: RightEnum,
    isArray: true,
    example: [RightEnum.CREATE_AD, RightEnum.DELETE_AD],
  })
  @IsArray({ message: 'Les droits doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un droit doit être sélectionné' })
  @IsEnum(RightEnum, {
    each: true,
    message: 'Chaque droit doit être une valeur valide',
  })
  rights: RightEnum[];
}
