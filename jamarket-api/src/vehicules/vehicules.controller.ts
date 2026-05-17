import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { FilterVehiculeDto } from './dto/filter-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';
import { VehiculesService } from './vehicules.service';

@Controller('vehicules')
export class VehiculesController {
  constructor(private readonly vehiculesService: VehiculesService) {}

  // ─── Routes publiques ────────────────────────────────────────────────────

  @Get()
  findAll(@Query() filters: FilterVehiculeDto) {
    return this.vehiculesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculesService.findOne(id);
  }

  // ─── Routes protégées (Employee / Admin uniquement) ──────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVehiculeDto) {
    return this.vehiculesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehiculeDto) {
    return this.vehiculesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.DELETE_AD)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculesService.remove(id);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  hardRemove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculesService.hardRemove(id);
  }
}
