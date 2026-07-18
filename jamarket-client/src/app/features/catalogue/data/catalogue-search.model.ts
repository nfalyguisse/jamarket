import type { VehicleCard } from '@core/models/vehicle-card.model';

export interface ApiFilterBrand {
  id: number;
  label: string;
}

export interface ApiFilterModel {
  id: number;
  label: string;
  brandId: number;
}

export interface ApiFilterOptions {
  brands: ApiFilterBrand[];
  models: ApiFilterModel[];
  fuelTypes: string[];
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
}

export const EMPTY_FILTER_OPTIONS: ApiFilterOptions = {
  brands: [],
  models: [],
  fuelTypes: [],
  priceRange: { min: 0, max: 100_000 },
  mileageRange: { min: 0, max: 300_000 },
};

export interface SearchPageResult {
  vehicles: VehicleCard[];
  total: number;
  totalPages: number;
  page: number;
}

export const EMPTY_SEARCH_RESULT: SearchPageResult = {
  vehicles: [],
  total: 0,
  totalPages: 1,
  page: 1,
};
