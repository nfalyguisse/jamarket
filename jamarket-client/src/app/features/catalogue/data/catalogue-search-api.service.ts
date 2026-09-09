import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mapAdToVehicleCard, type ApiAdResponse } from '../../ads/data/ad-api.mapper';
import type { CatalogueFiltersState } from './catalogue-filters.model';
import {
  type ApiFilterOptions,
  type SearchPageResult,
} from './catalogue-search.model';

interface ApiSearchPageResponse {
  data: ApiAdResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CatalogueSearchParams {
  filters: CatalogueFiltersState;
  sort: string;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogueSearchApiService {
  private readonly http = inject(HttpClient);
  private readonly searchUrl = `${environment.apiUrl}/search`;

  search({ filters, sort, page, limit }: CatalogueSearchParams): Observable<SearchPageResult> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('sort', sort);

    if (filters.query.trim()) {
      params = params.set('q', filters.query.trim());
    }
    if (filters.brandId !== null) {
      params = params.set('brand', filters.brandId);
    }
    if (filters.modelId !== null) {
      params = params.set('model', filters.modelId);
    }
    if (filters.priceMin !== null) {
      params = params.set('priceMin', filters.priceMin);
    }
    if (filters.priceMax !== null) {
      params = params.set('priceMax', filters.priceMax);
    }
    if (filters.fuel) {
      params = params.set('fuel', filters.fuel);
    }
    if (filters.yearMin !== null) {
      params = params.set('yearMin', filters.yearMin);
    }
    if (filters.yearMax !== null) {
      params = params.set('yearMax', filters.yearMax);
    }

    return this.http
      .get<ApiSearchPageResponse>(this.searchUrl, { params })
      .pipe(
        map((response) => ({
          vehicles: response.data.map(mapAdToVehicleCard),
          total: response.meta.total,
          totalPages: response.meta.totalPages,
          page: response.meta.page,
        })),
      );
  }

  getFilterOptions(brandId?: number): Observable<ApiFilterOptions> {
    let params = new HttpParams();
    if (brandId !== undefined) {
      params = params.set('brand', brandId);
    }
    return this.http.get<ApiFilterOptions>(`${this.searchUrl}/filters`, { params });
  }
}
