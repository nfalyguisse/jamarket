import type { ParamMap } from '@angular/router';
import {
  DEFAULT_CATALOGUE_FILTERS,
  type CatalogueFiltersState,
  type CatalogueYearRange,
} from './catalogue-filters.model';

const VALID_YEAR_RANGES: ReadonlyArray<CatalogueYearRange> = [
  '2020+',
  '2015-2019',
  '2010-2014',
  'classic',
];

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
  const yearRaw = params.get('year');
  const yearRange =
    yearRaw && (VALID_YEAR_RANGES as string[]).includes(yearRaw)
      ? (yearRaw as CatalogueYearRange)
      : null;

  return {
    query: params.get('q') ?? '',
    brandId: parseIntOrNull(params.get('brand')),
    modelId: parseIntOrNull(params.get('model')),
    priceMin: parseNumberOrNull(params.get('priceMin')),
    priceMax: parseNumberOrNull(params.get('priceMax')),
    yearRange,
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
    year: filters.yearRange ?? null,
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
    filters.yearRange !== null ||
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
    a.yearRange === b.yearRange &&
    a.fuel === b.fuel
  );
}

export function resetFilters(): CatalogueFiltersState {
  return { ...DEFAULT_CATALOGUE_FILTERS };
}
