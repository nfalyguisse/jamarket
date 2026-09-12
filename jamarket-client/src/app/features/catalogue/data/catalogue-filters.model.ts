export interface CatalogueFiltersState {
  query: string;
  brandId: number | null;
  modelId: number | null;
  priceMin: number | null;
  priceMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  fuel: string | null;
}

export interface CataloguePriceBounds {
  min: number;
  max: number;
}

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
  yearMin: null,
  yearMax: null,
  fuel: null,
};
