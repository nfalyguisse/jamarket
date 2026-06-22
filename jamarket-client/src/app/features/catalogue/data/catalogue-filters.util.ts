import type { VehicleCard } from '@core/models/vehicle-card.model';
import type {
  CatalogueFiltersState,
  CataloguePriceBounds,
  CatalogueYearRange,
} from './catalogue-filters.model';

const DEFAULT_PRICE_BOUNDS: CataloguePriceBounds = { min: 0, max: 100_000 };

function vehicleBrand(vehicle: VehicleCard): string {
  return vehicle.brandLabel?.trim() ?? '';
}

function vehicleModel(vehicle: VehicleCard): string {
  return vehicle.modelLabel?.trim() ?? '';
}

function matchesYearRange(year: number, range: CatalogueYearRange): boolean {
  switch (range) {
    case '2020+':
      return year >= 2020;
    case '2015-2019':
      return year >= 2015 && year <= 2019;
    case '2010-2014':
      return year >= 2010 && year <= 2014;
    case 'classic':
      return year < 2010;
    default:
      return true;
  }
}

export function getPriceBounds(vehicles: VehicleCard[]): CataloguePriceBounds {
  if (vehicles.length === 0) {
    return DEFAULT_PRICE_BOUNDS;
  }

  const prices = vehicles.map((v) => v.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function extractBrandOptions(vehicles: VehicleCard[]): string[] {
  const brands = new Set<string>();
  for (const vehicle of vehicles) {
    const brand = vehicleBrand(vehicle);
    if (brand) {
      brands.add(brand);
    }
  }
  return [...brands].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function extractModelOptions(
  vehicles: VehicleCard[],
  brand: string,
): string[] {
  const models = new Set<string>();
  for (const vehicle of vehicles) {
    if (brand && vehicleBrand(vehicle) !== brand) {
      continue;
    }
    const model = vehicleModel(vehicle);
    if (model) {
      models.add(model);
    }
  }
  return [...models].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function applyCatalogueFilters(
  vehicles: VehicleCard[],
  filters: CatalogueFiltersState,
): VehicleCard[] {
  return vehicles.filter((vehicle) => {
    if (filters.brand && vehicleBrand(vehicle) !== filters.brand) {
      return false;
    }

    if (filters.model && vehicleModel(vehicle) !== filters.model) {
      return false;
    }

    if (filters.priceMin !== null && vehicle.price < filters.priceMin) {
      return false;
    }

    if (filters.priceMax !== null && vehicle.price > filters.priceMax) {
      return false;
    }

    if (filters.yearRange && !matchesYearRange(vehicle.year, filters.yearRange)) {
      return false;
    }

    if (filters.fuelTypes.length > 0) {
      const fuel = vehicle.fuelType?.trim() ?? '';
      if (!filters.fuelTypes.includes(fuel)) {
        return false;
      }
    }

    return true;
  });
}

export function hasActiveFilters(filters: CatalogueFiltersState): boolean {
  return (
    filters.brand !== '' ||
    filters.model !== '' ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.yearRange !== null ||
    filters.fuelTypes.length > 0
  );
}
