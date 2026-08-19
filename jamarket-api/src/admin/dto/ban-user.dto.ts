import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class BanUserDto {
  @ApiProperty({
    description:
      'true pour bannir (désactiver) le compte, false pour le réactiver',
    example: true,
  })
  @IsBoolean({ message: 'Le champ banned doit être un booléen' })
  banned: boolean;
}
