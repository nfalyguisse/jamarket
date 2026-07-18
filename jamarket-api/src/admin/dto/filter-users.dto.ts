import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class FilterUsersDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle (nom, prénom, email)',
    example: 'bernard',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par rôle', example: 2 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  roleId?: number;

  @ApiPropertyOptional({
    description: 'Ne conserver que les comptes liés à un garage',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  garageOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer sur le statut actif / inactif',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page', example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite par page', example: 20 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
