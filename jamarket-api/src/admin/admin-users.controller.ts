import {
  Body,
  Controller,
  Get,
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
import { AdminUsersService } from './admin-users.service';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

interface AuthRequest {
  user: {
    id: number;
    role: { rights: RightEnum[] };
  };
}

@ApiTags('Admin Users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RightsGuard)
@RequireRights(RightEnum.SUPER_ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les utilisateurs',
    description:
      'Liste paginée et filtrable des comptes (recherche, rôle, garage, actif). ' +
      'Réservé au SUPER_ADMIN pour la modération et le RBAC back-office.',
  })
  @ApiResponse({ status: 200, description: 'Liste paginée des utilisateurs' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  findAll(@Query() filters: FilterUsersDto) {
    return this.adminUsersService.findAll(filters);
  }

  @Get('roles')
  @ApiOperation({
    summary: 'Rôles assignables',
    description:
      'Retourne les rôles pouvant être assignés lors de la création ou du changement ' +
      'de rôle d’un utilisateur. Alimente les sélecteurs du back-office admin.',
  })
  @ApiResponse({ status: 200, description: 'Liste des rôles assignables' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  getAssignableRoles() {
    return this.adminUsersService.getAssignableRoles();
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un utilisateur',
    description:
      'Crée un compte (souvent professionnel) avec un rôle donné. ' +
      'Un mot de passe temporaire peut être généré côté service. ' +
      'Réservé au SUPER_ADMIN.',
  })
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  create(@Body() dto: CreateUserDto, @Request() req: AuthRequest) {
    return this.adminUsersService.create(dto, req.user);
  }

  @Patch(':id/reset-password')
  @ApiOperation({
    summary: 'Réinitialiser le mot de passe',
    description:
      'Génère / réinitialise le mot de passe d’un utilisateur ciblé. ' +
      'Action administrative de support ; le nouvel secret est renvoyé selon la logique métier.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant utilisateur', example: 8 })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ) {
    return this.adminUsersService.resetPassword(id, req.user);
  }

  @Patch(':id/ban')
  @ApiOperation({
    summary: 'Bannir ou réactiver un compte',
    description:
      'Active ou désactive un compte frauduleux / problématique (banned: true|false). ' +
      'Le compte banni ne peut plus s’authentifier. Compétence P0 User Management.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant utilisateur', example: 8 })
  @ApiResponse({ status: 200, description: 'Statut ban mis à jour' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanUserDto,
    @Request() req: AuthRequest,
  ) {
    return this.adminUsersService.banUser(id, dto, req.user);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Changer le rôle d’un utilisateur',
    description:
      'Assigne un nouveau rôle (RBAC) à un utilisateur. ' +
      'Impacte immédiatement les droits appliqués par RightsGuard.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant utilisateur', example: 8 })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit SUPER_ADMIN manquant' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou rôle introuvable' })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: AuthRequest,
  ) {
    return this.adminUsersService.updateRole(id, dto, req.user);
  }
}
