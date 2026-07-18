import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ description: 'Nouveau prénom (back-office)', example: 'Jean' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Nouveau nom de famille (back-office)', example: 'Garage' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsOptional()
  lastName?: string;
}
