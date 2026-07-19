import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

interface AuthRequest {
  user: { id: number };
}

@ApiTags('Favoris')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les annonces favorites',
    description:
      'Retourne les annonces sauvegardées par l’utilisateur connecté, ' +
      'avec véhicule, images et vendeur. Les annonces archivées ou soft-deleted sont exclues.',
  })
  @ApiResponse({ status: 200, description: 'Liste des annonces favorites' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  list(@Request() req: AuthRequest) {
    return this.favoritesService.list(req.user.id);
  }

  @Get('ids')
  @ApiOperation({
    summary: 'Lister les IDs des annonces favorites',
    description:
      'Retourne uniquement les identifiants d’annonces favorites pour synchroniser l’état UI (cœurs).',
  })
  @ApiResponse({ status: 200, description: 'Tableau d’IDs d’annonces' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  listIds(@Request() req: AuthRequest) {
    return this.favoritesService.listIds(req.user.id);
  }

  @Post(':adId')
  @ApiOperation({
    summary: 'Ajouter une annonce aux favoris',
  })
  @ApiParam({ name: 'adId', type: Number, description: 'ID de l’annonce' })
  @ApiResponse({ status: 201, description: 'Annonce ajoutée aux favoris' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Annonce introuvable' })
  @ApiResponse({ status: 409, description: 'Déjà en favoris' })
  add(@Param('adId', ParseIntPipe) adId: number, @Request() req: AuthRequest) {
    return this.favoritesService.add(req.user.id, adId);
  }

  @Delete(':adId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirer une annonce des favoris',
  })
  @ApiParam({ name: 'adId', type: Number, description: 'ID de l’annonce' })
  @ApiResponse({ status: 200, description: 'Favori retiré' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Favori introuvable' })
  remove(
    @Param('adId', ParseIntPipe) adId: number,
    @Request() req: AuthRequest,
  ) {
    return this.favoritesService.remove(req.user.id, adId);
  }
}
