import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateAdDto {
  @ApiPropertyOptional({ description: 'Nouveau titre de l’annonce', example: 'Clio dCi — prix revu' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: 'Nouvelle description', example: 'Révision récente effectuée.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Nouveau prix (€)', example: 11990 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Activer ou désactiver la publication', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Marquer l’annonce comme vendue', example: false })
  @IsBoolean()
  @IsOptional()
  isSold?: boolean;
}
