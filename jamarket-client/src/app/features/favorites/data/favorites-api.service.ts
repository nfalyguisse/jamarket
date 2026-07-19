import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import type { VehicleCard } from '@core/models/vehicle-card.model';
import { environment } from '../../../../environments/environment';
import {
  type ApiAdResponse,
  mapAdToVehicleCard,
} from '../../ads/data/ad-api.mapper';

@Injectable({ providedIn: 'root' })
export class FavoritesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/favorites`;

  list(): Observable<VehicleCard[]> {
    return this.http
      .get<ApiAdResponse[]>(this.baseUrl)
      .pipe(map((ads) => ads.map((ad) => mapAdToVehicleCard(ad))));
  }

  listIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/ids`);
  }

  add(adId: number): Observable<ApiAdResponse> {
    return this.http.post<ApiAdResponse>(`${this.baseUrl}/${adId}`, {});
  }

  remove(adId: number): Observable<{ removed: boolean; adId: number }> {
    return this.http.delete<{ removed: boolean; adId: number }>(
      `${this.baseUrl}/${adId}`,
    );
  }
}
