import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { imageMulterOptions } from './multer.config';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('vehicules')
@UseGuards(JwtAuthGuard, RightsGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':vehiculeId/images')
  @RequireRights(RightEnum.CREATE_AD)
  @UseInterceptors(FilesInterceptor('files', 10, imageMulterOptions))
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'Jusqu’à 10 images (JPEG/PNG/WebP), compression côté serveur',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Uploader des images véhicule',
    description:
      'Ajoute jusqu’à 10 photos à une fiche véhicule via multipart/form-data (champ files). ' +
      'Les images sont stockées et associées au véhicule pour les galeries WebP du front-office. ' +
      'Requiert le droit CREATE_AD.',
  })
  @ApiParam({
    name: 'vehiculeId',
    description: 'Identifiant du véhicule',
    example: 42,
  })
  @ApiResponse({ status: 201, description: 'Images uploadées et liées' })
  @ApiResponse({ status: 400, description: 'Fichiers manquants ou invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit CREATE_AD manquant' })
  @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
  uploadImages(
    @Param('vehiculeId', ParseIntPipe) vehiculeId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadService.uploadVehiculeImages(vehiculeId, files);
  }

  @Delete(':vehiculeId/images/:imageId')
  @RequireRights(RightEnum.DELETE_AD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une image véhicule',
    description:
      'Supprime une image précise d’une fiche véhicule (fichier + enregistrement BDD). ' +
      'Requiert le droit DELETE_AD.',
  })
  @ApiParam({
    name: 'vehiculeId',
    description: 'Identifiant du véhicule',
    example: 42,
  })
  @ApiParam({
    name: 'imageId',
    description: 'Identifiant de l’image',
    example: 7,
  })
  @ApiResponse({ status: 200, description: 'Image supprimée' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Droit DELETE_AD manquant' })
  @ApiResponse({ status: 404, description: 'Véhicule ou image introuvable' })
  deleteImage(
    @Param('vehiculeId', ParseIntPipe) vehiculeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.uploadService.deleteVehiculeImage(vehiculeId, imageId);
  }
}
