import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { CatalogService } from './catalog.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { CreateVehiculeTypeDto } from './dto/create-vehicule-type.dto';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RightsGuard)
@RequireRights(RightEnum.CREATE_AD)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  createBrand(@Body() dto: CreateBrandDto) {
    return this.catalogService.createBrand(dto);
  }

  @Post('models')
  @HttpCode(HttpStatus.CREATED)
  createModel(@Body() dto: CreateModelDto) {
    return this.catalogService.createModel(dto);
  }

  @Post('vehicule-types')
  @HttpCode(HttpStatus.CREATED)
  createVehiculeType(@Body() dto: CreateVehiculeTypeDto) {
    return this.catalogService.createVehiculeType(dto);
  }
}
