import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Identifiant de l’annonce concernée',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'L’identifiant de l’annonce doit être un entier' })
  @Min(1, { message: 'L’identifiant de l’annonce est invalide' })
  adId: number;

  @ApiPropertyOptional({
    description: 'Premier message optionnel à envoyer au vendeur',
    example: 'Bonjour, le véhicule est-il toujours disponible ?',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Le message ne peut pas être vide' })
  @MaxLength(2000, { message: 'Le message ne peut pas dépasser 2000 caractères' })
  initialMessage?: string;
}
