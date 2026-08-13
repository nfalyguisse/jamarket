import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import type { VehicleCard } from '@core/models/vehicle-card.model';
import { environment } from '../../../../environments/environment';
import {
  type ApiAdResponse,
  type ApiSearchResponse,
  mapAdToVehicleCard,
  unwrapSearchResponse,
} from '../../ads/data/ad-api.mapper';

@Injectable({ providedIn: 'root' })
export class CatalogueApiService {
  private readonly http = inject(HttpClient);
  private readonly adsUrl = `${environment.apiUrl}/annonces`;

  getVehicles(): Observable<VehicleCard[]> {
    return this.http
      .get<ApiAdResponse[] | ApiSearchResponse>(`${this.adsUrl}?limit=100`)
      .pipe(
        map((response) =>
          unwrapSearchResponse(response).map((ad) => mapAdToVehicleCard(ad)),
        ),
      );
  }
}
