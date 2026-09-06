import type { ParamMap } from '@angular/router';
import {
  DEFAULT_CATALOGUE_FILTERS,
  type CatalogueFiltersState,
} from './catalogue-filters.model';

function parseIntOrNull(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNumberOrNull(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseFiltersFromParams(params: ParamMap): CatalogueFiltersState {
  return {
    query: params.get('q') ?? '',
    brandId: parseIntOrNull(params.get('brand')),
    modelId: parseIntOrNull(params.get('model')),
    priceMin: parseNumberOrNull(params.get('priceMin')),
    priceMax: parseNumberOrNull(params.get('priceMax')),
    yearMin: parseIntOrNull(params.get('yearMin')),
    yearMax: parseIntOrNull(params.get('yearMax')),
    fuel: params.get('fuel') ?? null,
  };
}

export function filtersToQueryParams(
  filters: CatalogueFiltersState,
  sort: string,
  page: number,
  defaultSort: string,
): Record<string, string | null> {
  return {
    q: filters.query.trim() || null,
    brand: filters.brandId !== null ? String(filters.brandId) : null,
    model: filters.modelId !== null ? String(filters.modelId) : null,
    priceMin: filters.priceMin !== null ? String(filters.priceMin) : null,
    priceMax: filters.priceMax !== null ? String(filters.priceMax) : null,
    yearMin: filters.yearMin !== null ? String(filters.yearMin) : null,
    yearMax: filters.yearMax !== null ? String(filters.yearMax) : null,
    fuel: filters.fuel ?? null,
    sort: sort !== defaultSort ? sort : null,
    page: page > 1 ? String(page) : null,
  };
}

export function hasActiveFilters(filters: CatalogueFiltersState): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.brandId !== null ||
    filters.modelId !== null ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.yearMin !== null ||
    filters.yearMax !== null ||
    filters.fuel !== null
  );
}

export function filtersEqual(
  a: CatalogueFiltersState,
  b: CatalogueFiltersState,
): boolean {
  return (
    a.query === b.query &&
    a.brandId === b.brandId &&
    a.modelId === b.modelId &&
    a.priceMin === b.priceMin &&
    a.priceMax === b.priceMax &&
    a.yearMin === b.yearMin &&
    a.yearMax === b.yearMax &&
    a.fuel === b.fuel
  );
}

export function resetFilters(): CatalogueFiltersState {
  return { ...DEFAULT_CATALOGUE_FILTERS };
}
