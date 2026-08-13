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
  Request,
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
import { SearchAdDto } from '../search/dto/search-ad.dto';
import { SearchService } from '../search/search.service';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { FilterMineAdsDto } from './dto/filter-mine-ads.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

interface AuthRequest {
  user: {
    id: number;
    role: { rights: RightEnum[] };
  };
}

@ApiTags('Annonces')
@Controller('annonces')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly searchService: SearchService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister / rechercher les annonces publiques',
    description:
      'Endpoint public du catalogue Jamarket. Applique les filtres dynamiques ' +
      '(marque, modèle, prix, kilométrage, carburant, localisation, etc.) et la pagination. ' +
      'Retourne uniquement les annonces publiées et non soft-deleted.',
  })
  @ApiResponse({ status: 200, description: 'Liste paginée d’annonces' })
  @ApiResponse({ status: 400, description: 'Filtres invalides' })
  findAll(@Query() filters: SearchAdDto) {
    return this.searchService.search(filters);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Annonces du vendeur (stock dashboard)',
    description:
      'Liste les annonces du garage connecté pour le tableau de bord stock ' +
      '(Live, Draft, Sold selon le service). Requiert le droit CREATE_AD. ' +
      'Le query param scope ("mine" | "all") affine le périmètre visible.',
  })
  @ApiResponse({ status: 200, description: 'Annonces du vendeur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  findMine(@Query() filters: FilterMineAdsDto, @Request() req: AuthRequest) {
    return this.adsService.findMine(req.user, filters.scope);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Annonces en attente de validation',
    description:
      'Retourne les annonces en statut pending pour le vendeur / modérateur connecté. ' +
      'Utilisé dans le flux de modération avant publication publique.',
  })
  @ApiResponse({ status: 200, description: 'Liste des annonces pending' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  findPending(@Request() req: AuthRequest) {
    return this.adsService.findPending(req.user);
  }

  @Patch('pending/approve-all')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Approuver toutes les annonces en attente',
    description:
      'Passe en published toutes les annonces pending accessibles à l’utilisateur connecté. ' +
      'Opération de modération groupée pour accélérer la mise en ligne du stock.',
  })
  @ApiResponse({ status: 200, description: 'Annonces approuvées' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  approveAllPending(@Request() req: AuthRequest) {
    return this.adsService.approveAllPending(req.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d’une annonce publique',
    description:
      'Retourne la fiche détaillée d’une annonce (prix, description, véhicule, images). ' +
      'Accessible sans authentification pour le parcours acheteur.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de l’annonce',
    example: 12,
  })
  @ApiResponse({ status: 200, description: 'Détail de l’annonce' })
  @ApiResponse({ status: 404, description: 'Annonce introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une annonce',
    description:
      'Crée une annonce liée à un véhicule existant (vehiculeId). ' +
      'Réservé aux comptes disposant du droit CREATE_AD (vendeur garage). ' +
      'Le propriétaire est automatiquement l’utilisateur authentifié.',
  })
  @ApiResponse({ status: 201, description: 'Annonce créée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
  create(@Body() dto: CreateAdDto, @Request() req: AuthRequest) {
    return this.adsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Mettre à jour une annonce',
    description:
      'Met à jour partiellement titre, description, prix ou statuts (actif / vendu). ' +
      'L’auteur ou un admin autorisé peut modifier ; sinon 403.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de l’annonce',
    example: 12,
  })
  @ApiResponse({ status: 200, description: 'Annonce mise à jour' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Annonce introuvable' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdDto,
    @Request() req: AuthRequest,
  ) {
    return this.adsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete d’une annonce',
    description:
      'Marque l’annonce comme supprimée (soft-delete) sans effacer définitivement les données. ' +
      'Elle disparaît du catalogue public mais reste traçable en base.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de l’annonce',
    example: 12,
  })
  @ApiResponse({ status: 204, description: 'Annonce soft-deleted' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Annonce introuvable' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.adsService.remove(id, req.user);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Suppression définitive d’une annonce',
    description:
      'Efface définitivement l’annonce en base. Réservé au SUPER_ADMIN. ' +
      'À utiliser avec précaution (irréversible).',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de l’annonce',
    example: 12,
  })
  @ApiResponse({ status: 204, description: 'Annonce supprimée définitivement' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Annonce introuvable' })
  hardRemove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ) {
    return this.adsService.hardRemove(id, req.user);
  }

  @Patch(':id/sold')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Marquer une annonce comme vendue',
    description:
      'Passe l’annonce en statut vendu pour le dashboard stock du garage. ' +
      'L’annonce quitte typiquement le catalogue « Live ».',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de l’annonce',
    example: 12,
  })
  @ApiResponse({ status: 200, description: 'Annonce marquée vendue' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Annonce introuvable' })
  markAsSold(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ) {
    return this.adsService.markAsSold(id, req.user);
  }
}
