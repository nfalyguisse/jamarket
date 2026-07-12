import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import type {
  AdminAd,
  AdminAdListScope,
  AdminFormReferences,
  CreateAdPayload,
  CreateVehiculePayload,
  UpdateAdPayload,
  UpdateVehiculePayload,
} from '@core/models/admin-ad.model';
import { environment } from '../../environments/environment';
import type { ApiAdResponse } from '../../app/features/ads/data/ad-api.mapper';
import { mapApiAdToAdminAd } from './admin-ads-api.mapper';

@Injectable({ providedIn: 'root' })
export class AdminAdsApiService {
  private readonly http = inject(HttpClient);
  private readonly adsUrl = `${environment.apiUrl}/ads`;
  private readonly vehiculesUrl = `${environment.apiUrl}/vehicules`;
  private readonly searchUrl = `${environment.apiUrl}/search`;

  getMyAds(scope: AdminAdListScope = 'mine'): Observable<AdminAd[]> {
    return this.http
      .get<ApiAdResponse[]>(`${this.adsUrl}/mine`, { params: { scope } })
      .pipe(
      map((ads) =>
        ads
          .map(mapApiAdToAdminAd)
          .filter((ad): ad is AdminAd => ad !== null),
      ),
    );
  }

  getAd(id: number): Observable<AdminAd> {
    return this.http.get<ApiAdResponse>(`${this.adsUrl}/${id}`).pipe(
      map((ad) => {
        const mapped = mapApiAdToAdminAd(ad);
        if (!mapped) {
          throw new Error('Annonce invalide');
        }
        return mapped;
      }),
    );
  }

  getFormReferences(brandId?: number): Observable<AdminFormReferences> {
    const url =
      brandId !== undefined
        ? `${this.searchUrl}/references?brand=${brandId}`
        : `${this.searchUrl}/references`;
    return this.http.get<AdminFormReferences>(url);
  }

  createVehicule(payload: CreateVehiculePayload): Observable<{ id: number }> {
    return this.http
      .post<{ id: number }>(this.vehiculesUrl, payload)
      .pipe(map((vehicule) => ({ id: vehicule.id })));
  }

  updateVehicule(id: number, payload: UpdateVehiculePayload): Observable<void> {
    return this.http.patch<void>(`${this.vehiculesUrl}/${id}`, payload);
  }

  createAd(payload: CreateAdPayload): Observable<AdminAd> {
    return this.http.post<ApiAdResponse>(this.adsUrl, payload).pipe(
      map((ad) => {
        const mapped = mapApiAdToAdminAd(ad);
        if (!mapped) {
          throw new Error('Annonce créée invalide');
        }
        return mapped;
      }),
    );
  }

  updateAd(id: number, payload: UpdateAdPayload): Observable<AdminAd> {
    return this.http.patch<ApiAdResponse>(`${this.adsUrl}/${id}`, payload).pipe(
      map((ad) => {
        const mapped = mapApiAdToAdminAd(ad);
        if (!mapped) {
          throw new Error('Annonce mise à jour invalide');
        }
        return mapped;
      }),
    );
  }

  deleteAd(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adsUrl}/${id}`);
  }

  markAsSold(id: number): Observable<AdminAd> {
    return this.http.patch<ApiAdResponse>(`${this.adsUrl}/${id}/sold`, {}).pipe(
      map((ad) => {
        const mapped = mapApiAdToAdminAd(ad);
        if (!mapped) {
          throw new Error('Annonce invalide');
        }
        return mapped;
      }),
    );
  }
}
