import type { ApiAdResponse } from '../../app/features/ads/data/ad-api.mapper';
import type { AdminAd, AdminAdVehicule } from '@core/models/admin-ad.model';
import type { FuelType } from '@core/models/ad-detail.model';

function mapVehicule(vehicule: NonNullable<ApiAdResponse['vehicule']>): AdminAdVehicule | null {
  if (!vehicule.id || !vehicule.model?.brand) {
    return null;
  }

  return {
    id: vehicule.id,
    modelId: vehicule.model.id ?? 0,
    brandId: vehicule.model.brand.id ?? 0,
    brandLabel: vehicule.model.brand.label ?? '',
    modelLabel: vehicule.model.label ?? '',
    kilometer: vehicule.kilometer ?? 0,
    year: vehicule.year ?? 0,
    doorsNumber: vehicule.doorsNumber ?? 0,
    power: vehicule.power ?? '',
    fuel: (vehicule.fuel ?? 'essence') as FuelType,
    color: vehicule.color ?? '',
    vehiculeTypeId: vehicule.vehiculeType?.id ?? 0,
    vehiculeTypeLabel: vehicule.vehiculeType?.label ?? '',
    images: (vehicule.images ?? [])
      .filter((img): img is { id: number; url: string } =>
        typeof img.id === 'number' && typeof img.url === 'string',
      )
      .map((img) => ({ id: img.id, url: img.url })),
  };
}

export function mapApiAdToAdminAd(ad: ApiAdResponse): AdminAd | null {
  if (!ad.id || !ad.label || ad.description === undefined || !ad.vehicule) {
    return null;
  }

  const vehicule = mapVehicule(ad.vehicule);
  if (!vehicule) {
    return null;
  }

  return {
    id: Number(ad.id),
    label: ad.label,
    description: ad.description,
    price: Number(ad.price ?? 0),
    isActive: ad.isActive ?? true,
    isSold: ad.isSold ?? false,
    isArchived: ad.isArchived ?? false,
    createdAt: ad.createdAt ?? new Date().toISOString(),
    vehicule,
    ...(ad.seller?.id && ad.seller.name && ad.seller.lastName && ad.seller.email
      ? {
          seller: {
            id: ad.seller.id,
            name: ad.seller.name,
            lastName: ad.seller.lastName,
            email: ad.seller.email,
          },
        }
      : {}),
  };
}
