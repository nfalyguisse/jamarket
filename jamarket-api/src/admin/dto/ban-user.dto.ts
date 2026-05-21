import { IsBoolean } from 'class-validator';

export class BanUserDto {
  @IsBoolean({ message: 'Le champ banned doit être un booléen' })
  banned: boolean;
}
