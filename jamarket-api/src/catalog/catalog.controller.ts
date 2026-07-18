import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { CatalogService } from './catalog.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { CreateVehiculeTypeDto } from './dto/create-vehicule-type.dto';

@ApiTags('Catalogue')
@ApiBearerAuth('access-token')
@Controller('catalog')
@UseGuards(JwtAuthGuard, RightsGuard)
@RequireRights(RightEnum.CREATE_AD)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une marque',
    description:
      'Ajoute une marque au catalogue référentiel (ex. Renault, Peugeot). ' +
      'Réservé aux vendeurs disposant du droit CREATE_AD. ' +
      'Échoue en conflit si le libellé existe déjà.',
  })
  @ApiResponse({ status: 201, description: 'Marque créée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  @ApiResponse({ status: 409, description: 'Marque déjà existante' })
  createBrand(@Body() dto: CreateBrandDto) {
    return this.catalogService.createBrand(dto);
  }

  @Post('models')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un modèle',
    description:
      'Ajoute un modèle rattaché à une marque existante (ex. Clio sous Renault). ' +
      'Requiert le droit CREATE_AD.',
  })
  @ApiResponse({ status: 201, description: 'Modèle créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  @ApiResponse({ status: 404, description: 'Marque introuvable' })
  createModel(@Body() dto: CreateModelDto) {
    return this.catalogService.createModel(dto);
  }

  @Post('vehicule-types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un type de véhicule',
    description:
      'Ajoute un type de carrosserie / catégorie (citadine, SUV, utilitaire…). ' +
      'Utilisé dans les filtres de recherche et les fiches véhicules.',
  })
  @ApiResponse({ status: 201, description: 'Type créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  @ApiResponse({ status: 409, description: 'Type déjà existant' })
  createVehiculeType(@Body() dto: CreateVehiculeTypeDto) {
    return this.catalogService.createVehiculeType(dto);
  }
}
