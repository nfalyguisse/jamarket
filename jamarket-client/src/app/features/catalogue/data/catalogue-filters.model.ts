export type CatalogueYearRange = '2020+' | '2015-2019' | '2010-2014' | 'classic';

export interface CatalogueFiltersState {
  query: string;
  brandId: number | null;
  modelId: number | null;
  priceMin: number | null;
  priceMax: number | null;
  yearRange: CatalogueYearRange | null;
  fuel: string | null;
}

export interface CataloguePriceBounds {
  min: number;
  max: number;
}

export const CATALOGUE_YEAR_RANGE_OPTIONS: ReadonlyArray<{
  value: CatalogueYearRange;
  label: string;
}> = [
  { value: '2020+', label: '2020 et +' },
  { value: '2015-2019', label: '2015 – 2019' },
  { value: '2010-2014', label: '2010 – 2014' },
  { value: 'classic', label: 'Anciennes' },
];

export const FUEL_DISPLAY_LABELS: Record<string, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  electrique: 'Électrique',
  hybride: 'Hybride',
};

export const DEFAULT_CATALOGUE_FILTERS: CatalogueFiltersState = {
  query: '',
  brandId: null,
  modelId: null,
  priceMin: null,
  priceMax: null,
  yearRange: null,
  fuel: null,
};
