import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RightsGuard } from '../common/guards/rights.guard';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, RightsGuard, Reflector],
  exports: [CatalogService],
})
export class CatalogModule {}
