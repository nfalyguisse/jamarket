import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { avatarMulterOptions } from '../upload/multer.config';

/** Limite stricte anti brute-force sur les endpoints d’auth (5 / min / IP). */
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscrire un acheteur (client)',
    description:
      'Crée un compte acheteur privé sur Jamarket. Le mot de passe est hashé (bcrypt) ' +
      'et un couple accessToken / refreshToken JWT est renvoyé pour démarrer la session. ' +
      'Réservé aux clients front-office (pas de droits garage / admin).',
  })
  @ApiResponse({ status: 201, description: 'Compte créé et tokens délivrés' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion acheteur (front-office)',
    description:
      'Authentifie un client acheteur avec email et mot de passe. ' +
      'Refuse les comptes inactifs, soft-deleted ou réservés au back-office. ' +
      'Retourne un accessToken (Bearer, courte durée) et un refreshToken.',
  })
  @ApiResponse({ status: 200, description: 'Tokens JWT délivrés' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({
    status: 401,
    description: 'Identifiants incorrects ou accès non autorisé',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('admin/login')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion back-office (garage / admin)',
    description:
      'Authentifie un utilisateur professionnel (vendeur garage ou administrateur) ' +
      'disposant des droits back-office (ADMIN ou CREATE_AD). ' +
      'Utilisé par le dashboard vendeur et la console super-admin.',
  })
  @ApiResponse({ status: 200, description: 'Tokens JWT back-office délivrés' })
  @ApiResponse({
    status: 401,
    description: 'Identifiants incorrects ou droits insuffisants',
  })
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Get('admin/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Profil back-office connecté',
    description:
      'Retourne le profil de l’utilisateur professionnel authentifié (identité, rôle, avatar). ' +
      'Nécessite un accessToken Bearer valide obtenu via /auth/admin/login.',
  })
  @ApiResponse({ status: 200, description: 'Profil admin / vendeur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  getAdminProfile(@Request() req: { user: { id: number } }) {
    return this.authService.getAdminProfile(req.user.id);
  }

  @Patch('admin/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour le profil back-office',
    description:
      'Permet à un vendeur ou admin de modifier son prénom et son nom. ' +
      'Les champs absents du body ne sont pas modifiés.',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  updateAdminProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.authService.updateAdminProfile(req.user.id, dto);
  }

  @Patch('admin/me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Changer le mot de passe back-office',
    description:
      'Vérifie le mot de passe actuel puis enregistre le nouveau (hash bcrypt, min. 8 caractères). ' +
      'Échoue avec 401 si le mot de passe actuel est incorrect.',
  })
  @ApiResponse({ status: 200, description: 'Mot de passe changé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({
    status: 401,
    description: 'Mot de passe actuel incorrect ou non authentifié',
  })
  changeAdminPassword(
    @Request() req: { user: { id: number } },
    @Body() dto: ChangeAdminPasswordDto,
  ) {
    return this.authService.changeAdminPassword(req.user.id, dto);
  }

  @Post('admin/me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image avatar (JPEG/PNG/WebP)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Uploader l’avatar back-office',
    description:
      'Envoie une image multipart (champ file) pour remplacer l’avatar du compte professionnel. ' +
      'L’ancienne image est remplacée côté stockage local.',
  })
  @ApiResponse({ status: 200, description: 'Avatar mis à jour' })
  @ApiResponse({ status: 400, description: 'Fichier manquant ou invalide' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  uploadAdminAvatar(
    @Request() req: { user: { id: number } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadAdminAvatar(req.user.id, file);
  }

  @Delete('admin/me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer l’avatar back-office',
    description:
      'Retire l’avatar du compte professionnel et nettoie le fichier associé sur le disque.',
  })
  @ApiResponse({ status: 200, description: 'Avatar supprimé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  deleteAdminAvatar(@Request() req: { user: { id: number } }) {
    return this.authService.deleteAdminAvatar(req.user.id);
  }

  @Post('admin/refresh')
  @Throttle(AUTH_THROTTLE)
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rafraîchir les tokens back-office',
    description:
      'Échange un refreshToken valide (envoyé dans le corps JSON, pas en Bearer) ' +
      'contre un nouveau couple accessToken / refreshToken pour une session back-office. ' +
      'Le compte doit toujours disposer des droits professionnels.',
  })
  @ApiResponse({ status: 200, description: 'Nouveaux tokens délivrés' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  adminRefresh(
    @Body() _dto: RefreshTokenDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.authService.adminRefresh(req.user.id);
  }

  @Post('refresh')
  @Throttle(AUTH_THROTTLE)
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rafraîchir les tokens acheteur',
    description:
      'Échange un refreshToken (corps JSON { refreshToken }) contre de nouveaux tokens ' +
      'pour un compte acheteur front-office. Ne pas utiliser l’en-tête Authorization Bearer ici.',
  })
  @ApiResponse({ status: 200, description: 'Nouveaux tokens délivrés' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  refresh(
    @Body() _dto: RefreshTokenDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.authService.refresh(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Profil acheteur connecté',
    description:
      'Retourne les informations du client authentifié (identité, email). ' +
      'Nécessite un accessToken Bearer obtenu via /auth/login.',
  })
  @ApiResponse({ status: 200, description: 'Profil client' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  getProfile(@Request() req: { user: { id: number } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour le profil acheteur',
    description:
      'Met à jour partiellement prénom, nom et/ou mot de passe du client connecté. ' +
      'Conforme RGPD : l’utilisateur maîtrise ses données personnelles.',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  updateProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Droit à l’oubli (suppression du compte)',
    description:
      'Exerce le droit à l’oubli RGPD : soft-delete du compte acheteur et anonymisation ' +
      'des données personnelles associées. Irréversible côté utilisateur. ' +
      'Répond 204 sans corps en cas de succès.',
  })
  @ApiResponse({ status: 204, description: 'Compte anonymisé / soft-deleted' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  forgetMe(@Request() req: { user: { id: number } }) {
    return this.authService.forgetMe(req.user.id);
  }
}
