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
  Request,
  UseGuards,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { SearchAdDto } from '../search/dto/search-ad.dto';
import { SearchService } from '../search/search.service';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

interface AuthRequest {
  user: {
    id: number;
    role: { rights: RightEnum[] };
  };
}

@Controller('ads')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly searchService: SearchService,
  ) {}

  // ─── Routes publiques ────────────────────────────────────────────────────

  @Get()
  findAll(@Query() filters: SearchAdDto) {
    return this.searchService.search(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adsService.findOne(id);
  }

  // ─── Routes protégées ────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.CREATE_AD)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAdDto, @Request() req: AuthRequest) {
    return this.adsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdDto,
    @Request() req: AuthRequest,
  ) {
    return this.adsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.adsService.remove(id, req.user);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @RequireRights(RightEnum.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  hardRemove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.adsService.hardRemove(id, req.user);
  }

  @Patch(':id/sold')
  @UseGuards(JwtAuthGuard)
  markAsSold(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.adsService.markAsSold(id, req.user);
  }
}
