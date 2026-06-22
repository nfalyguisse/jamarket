export type CatalogueYearRange = '2020+' | '2015-2019' | '2010-2014' | 'classic';

export interface CatalogueFiltersState {
  brand: string;
  model: string;
  priceMin: number | null;
  priceMax: number | null;
  yearRange: CatalogueYearRange | null;
  fuelTypes: string[];
}

export interface CataloguePriceBounds {
  min: number;
  max: number;
}

export const CATALOGUE_FUEL_FILTER_OPTIONS = [
  { value: 'Électrique', label: 'Électrique' },
  { value: 'Hybride', label: 'Hybride' },
  { value: 'Essence', label: 'Essence' },
  { value: 'Diesel', label: 'Diesel' },
] as const;

export const CATALOGUE_YEAR_RANGE_OPTIONS: ReadonlyArray<{
  value: CatalogueYearRange;
  label: string;
}> = [
  { value: '2020+', label: '2020 et +' },
  { value: '2015-2019', label: '2015 – 2019' },
  { value: '2010-2014', label: '2010 – 2014' },
  { value: 'classic', label: 'Anciennes' },
];

export const DEFAULT_CATALOGUE_FILTERS: CatalogueFiltersState = {
  brand: '',
  model: '',
  priceMin: null,
  priceMax: null,
  yearRange: null,
  fuelTypes: [],
};
