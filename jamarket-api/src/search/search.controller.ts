import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { SearchAdDto } from './dto/search-ad.dto';
import { SearchService } from './search.service';

class FilterOptionsQuery {
  @ApiPropertyOptional({
    description: 'Identifiant de marque pour filtrer les modèles disponibles',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  brand?: number;
}

@ApiTags('Recherche')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Moteur de recherche d’annonces',
    description:
      'Recherche avancée côté front-office : combine filtres (marque, modèle, prix, ' +
      'kilométrage, carburant, localisation, année, texte libre) et tri. ' +
      'Endpoint public du parcours acheteur (P0 Smart Search).',
  })
  @ApiResponse({ status: 200, description: 'Résultats de recherche paginés' })
  @ApiResponse({
    status: 400,
    description: 'Paramètres de recherche invalides',
  })
  search(@Query() dto: SearchAdDto) {
    return this.searchService.search(dto);
  }

  @Get('filters')
  @ApiOperation({
    summary: 'Options de filtres dynamiques',
    description:
      'Retourne les valeurs disponibles pour peupler les listes déroulantes de filtres ' +
      '(marques, modèles selon brand, types, etc.). Le paramètre brand affine les modèles.',
  })
  @ApiResponse({ status: 200, description: 'Options de filtres' })
  getFilters(@Query() query: FilterOptionsQuery) {
    return this.searchService.getFilterOptions(query.brand);
  }

  @Get('references')
  @ApiOperation({
    summary: 'Références pour formulaires',
    description:
      'Fournit les référentiels catalogue utiles aux formulaires de création ' +
      '(marques, modèles, types de véhicules). Optionnellement filtrés par marque.',
  })
  @ApiResponse({ status: 200, description: 'Références catalogue' })
  getReferences(@Query() query: FilterOptionsQuery) {
    return this.searchService.getFormReferences(query.brand);
  }
}
