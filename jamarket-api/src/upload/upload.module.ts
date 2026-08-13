import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RightsGuard } from '../common/guards/rights.guard';
import { CloudinaryService } from './cloudinary.service';
import { ImageProcessingService } from './image-processing.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController],
  providers: [
    CloudinaryService,
    UploadService,
    ImageProcessingService,
    RightsGuard,
    Reflector,
  ],
  exports: [UploadService, ImageProcessingService, CloudinaryService],
})
export class UploadModule {}
