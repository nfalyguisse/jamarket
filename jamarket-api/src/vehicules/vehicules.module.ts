import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RightsGuard } from '../common/guards/rights.guard';
import { UploadModule } from '../upload/upload.module';
import { VehiculesController } from './vehicules.controller';
import { VehiculesService } from './vehicules.service';

@Module({
  imports: [UploadModule],
  controllers: [VehiculesController],
  providers: [VehiculesService, RightsGuard, Reflector],
  exports: [VehiculesService],
})
export class VehiculesModule {}
