import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RightsGuard } from '../common/guards/rights.guard';
import { ImageProcessingService } from './image-processing.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, ImageProcessingService, RightsGuard, Reflector],
  exports: [UploadService, ImageProcessingService],
})
export class UploadModule {}
