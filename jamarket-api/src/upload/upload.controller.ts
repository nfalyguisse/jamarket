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
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { imageMulterOptions } from './multer.config';
import { UploadService } from './upload.service';

@Controller('vehicules')
@UseGuards(JwtAuthGuard, RightsGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post(':vehiculeId/images')
  @RequireRights(RightEnum.CREATE_AD)
  @UseInterceptors(FilesInterceptor('files', 10, imageMulterOptions))
  @HttpCode(HttpStatus.CREATED)
  uploadImages(
    @Param('vehiculeId', ParseIntPipe) vehiculeId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadService.uploadVehiculeImages(vehiculeId, files);
  }

  @Delete(':vehiculeId/images/:imageId')
  @RequireRights(RightEnum.DELETE_AD)
  @HttpCode(HttpStatus.OK)
  deleteImage(
    @Param('vehiculeId', ParseIntPipe) vehiculeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.uploadService.deleteVehiculeImage(vehiculeId, imageId);
  }
}
