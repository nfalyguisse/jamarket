import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { FilterVehiculeDto } from './dto/filter-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';
import { VehiculesService } from './vehicules.service';

@ApiTags('Véhicules')
@Controller('vehicules')
export class VehiculesController {
  constructor(private readonly vehiculesService: VehiculesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les véhicules',
    description:
      'Liste paginée des fiches techniques véhicules du stock, filtrables par marque, ' +
      'modèle, carburant, type, kilométrage et année. Endpoint public pour consultation.',
  })
  @ApiResponse({ status: 200, description: 'Liste paginée de véhicules' })
  @ApiResponse({ status: 400, description: 'Filtres invalides' })
  findAll(@Query() filters: FilterVehiculeDto) {
    return this.vehiculesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d’un véhicule',
    description:
      'Retourne la fiche technique complète d’un véhicule (specs, images, modèle / marque). ' +
      'Accessible sans authentification.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du véhicule', example: 42 })
  @ApiResponse({ status: 200, description: 'Fiche véhicule' })
  @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une fiche véhicule',
    description:
      'Enregistre une nouvelle fiche technique dans le stock garage (kilométrage, année, ' +
      'carburant, type, etc.). Requiert le droit CREATE_AD. ' +
      'Les images peuvent être fournies via imageUrls ou uploadées ensuite.',
  })
  @ApiResponse({ status: 201, description: 'Véhicule créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  create(@Body() dto: CreateVehiculeDto) {
    return this.vehiculesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Mettre à jour un véhicule',
    description:
      'Met à jour partiellement les caractéristiques techniques d’un véhicule du stock. ' +
      'Requiert le droit CREATE_AD.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du véhicule', example: 42 })
  @ApiResponse({ status: 200, description: 'Véhicule mis à jour' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehiculeDto) {
    return this.vehiculesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.DELETE_AD)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete d’un véhicule',
    description:
      'Marque le véhicule comme supprimé (soft-delete). Requiert le droit DELETE_AD. ' +
      'Les annonces liées peuvent être impactées selon la logique métier.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du véhicule', example: 42 })
  @ApiResponse({ status: 204, description: 'Véhicule soft-deleted' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit DELETE_AD manquant' })
  @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculesService.remove(id);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Suppression définitive d’un véhicule',
    description:
      'Efface définitivement la fiche véhicule. Réservé au SUPER_ADMIN. Irréversible.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du véhicule', example: 42 })
  @ApiResponse({ status: 204, description: 'Véhicule supprimé définitivement' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
  hardRemove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculesService.hardRemove(id);
  }
}
