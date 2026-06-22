import type { AdDetail, AdSpecItem, FuelType } from '@core/models/ad-detail.model';
import type { VehicleCard } from '@core/models/vehicle-card.model';

interface ApiBrand {
  label?: string;
}

interface ApiModel {
  label?: string;
  brand?: ApiBrand;
}

interface ApiVehiculeType {
  label?: string;
}

interface ApiImage {
  id?: number;
  url?: string;
}

interface ApiVehicule {
  id?: number;
  kilometer?: number;
  year?: number;
  doorsNumber?: number;
  power?: string;
  fuel?: FuelType;
  color?: string;
  vehiculeYear?: number;
  model?: ApiModel;
  vehiculeType?: ApiVehiculeType;
  images?: ApiImage[];
}

interface ApiSeller {
  id?: number;
  name?: string;
  lastName?: string;
  email?: string;
}

export interface ApiAdResponse {
  id?: number | string;
  label?: string;
  description?: string;
  price?: number | string;
  isActive?: boolean;
  isSold?: boolean;
  createdAt?: string;
  vehicule?: ApiVehicule;
  seller?: ApiSeller | null;
}

export interface ApiSearchResponse {
  data?: ApiAdResponse[];
}

const FUEL_LABELS: Record<FuelType, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  electrique: 'Électrique',
  hybride: 'Hybride',
};

export function formatFuelLabel(fuel: FuelType): string {
  return FUEL_LABELS[fuel] ?? fuel;
}

export function mapAdToVehicleCard(ad: ApiAdResponse): VehicleCard {
  const vehicule = ad.vehicule;
  const brand = vehicule?.model?.brand?.label?.trim();
  const model = vehicule?.model?.label?.trim();
  const fallbackTitle = [brand, model].filter(Boolean).join(' ').trim();
  const title = ad.label?.trim() || fallbackTitle || 'Véhicule disponible';

  return {
    id: String(ad.id),
    title,
    brandLabel: brand || undefined,
    modelLabel: model || undefined,
    price: Number(ad.price ?? 0),
    mileageKm: Number(vehicule?.kilometer ?? 0),
    year: Number(vehicule?.year ?? new Date().getFullYear()),
    transmission: 'Non précisée',
    fuelType: vehicule?.fuel ? formatFuelLabel(vehicule.fuel) : undefined,
    imageUrl:
      vehicule?.images?.[0]?.url ?? '/assets/images/vehicle-placeholder.webp',
    imageAlt: `Photo du véhicule ${title}`,
  };
}

export function mapAdToDetail(ad: ApiAdResponse): AdDetail | null {
  const vehicule = ad.vehicule;
  if (!ad.id || !vehicule?.id || !ad.label || ad.description === undefined) {
    return null;
  }

  const brandLabel = vehicule.model?.brand?.label?.trim() ?? '';
  const modelLabel = vehicule.model?.label?.trim() ?? '';

  return {
    id: Number(ad.id),
    label: ad.label,
    description: ad.description,
    price: Number(ad.price ?? 0),
    isActive: ad.isActive ?? true,
    isSold: ad.isSold ?? false,
    createdAt: ad.createdAt ?? new Date().toISOString(),
    vehicule: {
      id: vehicule.id,
      kilometer: vehicule.kilometer ?? 0,
      year: vehicule.year ?? 0,
      doorsNumber: vehicule.doorsNumber ?? 0,
      power: vehicule.power ?? '',
      fuel: vehicule.fuel ?? 'essence',
      color: vehicule.color ?? '',
      vehiculeYear: vehicule.vehiculeYear ?? vehicule.year ?? 0,
      brandLabel,
      modelLabel,
      vehiculeTypeLabel: vehicule.vehiculeType?.label ?? '',
      images: (vehicule.images ?? [])
        .filter((img): img is ApiImage & { id: number; url: string } =>
          typeof img.id === 'number' && !!img.url,
        )
        .map((img) => ({ id: img.id, url: img.url })),
    },
    seller:
      ad.seller?.id && ad.seller.name && ad.seller.lastName && ad.seller.email
        ? {
            id: ad.seller.id,
            name: ad.seller.name,
            lastName: ad.seller.lastName,
            email: ad.seller.email,
          }
        : null,
  };
}

export function buildAdSpecs(ad: AdDetail): AdSpecItem[] {
  const v = ad.vehicule;
  const specs: AdSpecItem[] = [];

  if (v.year) {
    specs.push({ key: 'year', label: 'Année', value: String(v.year) });
  }
  if (v.kilometer >= 0) {
    specs.push({
      key: 'kilometer',
      label: 'Kilométrage',
      value: `${v.kilometer.toLocaleString('fr-FR')} km`,
    });
  }
  if (v.fuel) {
    specs.push({ key: 'fuel', label: 'Énergie', value: formatFuelLabel(v.fuel) });
  }
  if (v.doorsNumber) {
    specs.push({ key: 'doors', label: 'Portes', value: String(v.doorsNumber) });
  }
  if (v.power?.trim()) {
    specs.push({ key: 'power', label: 'Puissance', value: v.power });
  }
  if (v.color?.trim()) {
    specs.push({ key: 'color', label: 'Couleur', value: v.color });
  }
  if (v.vehiculeTypeLabel?.trim()) {
    specs.push({ key: 'type', label: 'Type', value: v.vehiculeTypeLabel });
  }
  if (v.vehiculeYear && v.vehiculeYear !== v.year) {
    specs.push({
      key: 'vehiculeYear',
      label: 'Année modèle',
      value: String(v.vehiculeYear),
    });
  }

  return specs;
}

export function unwrapSearchResponse(
  response: ApiAdResponse[] | ApiSearchResponse,
): ApiAdResponse[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response.data ?? [];
}
