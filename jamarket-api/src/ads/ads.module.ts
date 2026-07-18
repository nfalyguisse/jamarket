import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RightsGuard } from '../common/guards/rights.guard';
import { SearchModule } from '../search/search.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [SearchModule],
  controllers: [AdsController],
  providers: [AdsService, RightsGuard, Reflector],
  exports: [AdsService],
})
export class AdsModule {}
