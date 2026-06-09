import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import type { VehicleCard } from '@core/models/vehicle-card.model';
import { environment } from '../../../../environments/environment';

interface ApiAd {
  id: number | string;
  title?: string;
  price?: number | string;
  mileageKm?: number | string;
  mileage?: number | string;
  year?: number | string;
  transmission?: string;
  gearbox?: string;
  fuelType?: string;
  fuel?: string;
  images?: Array<{ url?: string }>;
  imageUrl?: string;
  brand?: { name?: string };
  model?: { name?: string };
}

@Injectable({ providedIn: 'root' })
export class CatalogueApiService {
  private readonly http = inject(HttpClient);
  private readonly adsUrl = `${environment.apiUrl}/ads`;

  getVehicles(): Observable<VehicleCard[]> {
    return this.http
      .get<ApiAd[]>(this.adsUrl)
      .pipe(map((ads) => ads.map((ad) => this.toVehicleCard(ad))));
  }

  private toVehicleCard(ad: ApiAd): VehicleCard {
    const brand = ad.brand?.name?.trim();
    const model = ad.model?.name?.trim();
    const fallbackTitle = [brand, model].filter(Boolean).join(' ').trim();

    return {
      id: String(ad.id),
      title: ad.title?.trim() || fallbackTitle || 'Véhicule disponible',
      price: Number(ad.price ?? 0),
      mileageKm: Number(ad.mileageKm ?? ad.mileage ?? 0),
      year: Number(ad.year ?? new Date().getFullYear()),
      transmission: ad.transmission ?? ad.gearbox ?? 'Non précisée',
      fuelType: ad.fuelType ?? ad.fuel ?? 'Non précisé',
      imageUrl: ad.images?.[0]?.url ?? ad.imageUrl ?? '/assets/images/vehicle-placeholder.webp',
      imageAlt: `Photo du véhicule ${ad.title?.trim() || fallbackTitle || ''}`.trim(),
    };
  }
}
