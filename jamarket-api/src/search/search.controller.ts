import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { SearchAdDto } from './dto/search-ad.dto';
import { SearchService } from './search.service';

class FilterOptionsQuery {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  brand?: number;
}

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query() dto: SearchAdDto) {
    return this.searchService.search(dto);
  }

  @Get('filters')
  getFilters(@Query() query: FilterOptionsQuery) {
    return this.searchService.getFilterOptions(query.brand);
  }
}
