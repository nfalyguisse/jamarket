import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export type AdListScope = 'mine' | 'all';

export class FilterMineAdsDto {
  @ApiPropertyOptional({
    description:
      'Périmètre de liste : "mine" pour les annonces du vendeur connecté, "all" pour le stock visible selon les droits',
    enum: ['mine', 'all'],
    example: 'mine',
  })
  @IsOptional()
  @IsIn(['mine', 'all'], { message: 'Le filtre doit être "mine" ou "all"' })
  scope?: AdListScope;
}
