import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Nouvel identifiant de rôle à assigner à l’utilisateur',
    example: 3,
  })
  @IsInt({ message: "L'identifiant du rôle doit être un entier" })
  @IsPositive({ message: "L'identifiant du rôle doit être supérieur à 0" })
  roleId: number;
}
