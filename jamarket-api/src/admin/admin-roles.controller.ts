import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { AdminRolesService } from './admin-roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Admin Roles')
@ApiBearerAuth('access-token')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RightsGuard)
@RequireRights(RightEnum.SUPER_ADMIN)
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les rôles',
    description:
      'Retourne tous les rôles définis dans le système avec leurs droits associés. ' +
      'Réservé au SUPER_ADMIN pour la gestion RBAC.',
  })
  @ApiResponse({ status: 200, description: 'Liste des rôles' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  findAll() {
    return this.adminRolesService.findAll();
  }

  @Get('available-rights')
  @ApiOperation({
    summary: 'Droits disponibles',
    description:
      'Liste l’énumération des droits (CREATE_AD, DELETE_AD, SUPER_ADMIN, etc.) ' +
      'pouvant être affectés à un rôle lors de la création ou de la mise à jour.',
  })
  @ApiResponse({ status: 200, description: 'Liste des RightEnum' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  getAvailableRights() {
    return this.adminRolesService.getAvailableRights();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d’un rôle',
    description:
      'Retourne le libellé et les droits d’un rôle donné, pour l’écran d’édition admin.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du rôle', example: 2 })
  @ApiResponse({ status: 200, description: 'Détail du rôle' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Rôle introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminRolesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un rôle',
    description:
      'Crée un nouveau rôle avec au moins un droit. ' +
      'Permet d’étendre le modèle de permissions (scopes admin / vendeur).',
  })
  @ApiResponse({ status: 201, description: 'Rôle créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 409, description: 'Rôle déjà existant' })
  create(@Body() dto: CreateRoleDto) {
    return this.adminRolesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un rôle',
    description:
      'Modifie le libellé et/ou remplace la liste des droits d’un rôle existant. ' +
      'Les utilisateurs ayant ce rôle héritent immédiatement des nouveaux droits.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du rôle', example: 2 })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Rôle introuvable' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.adminRolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un rôle',
    description:
      'Supprime un rôle s’il n’est plus référencé (ou selon les garde-fous du service). ' +
      'Action SUPER_ADMIN sensible pour la cohérence RBAC.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du rôle', example: 2 })
  @ApiResponse({ status: 200, description: 'Rôle supprimé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Rôle introuvable' })
  @ApiResponse({
    status: 409,
    description: 'Rôle encore assigné à des utilisateurs',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminRolesService.remove(id);
  }
}
