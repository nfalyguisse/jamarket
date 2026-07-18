import { IsIn, IsOptional } from 'class-validator';

export type AdListScope = 'mine' | 'all';

export class FilterMineAdsDto {
  @IsOptional()
  @IsIn(['mine', 'all'], { message: 'Le filtre doit être "mine" ou "all"' })
  scope?: AdListScope;
}
