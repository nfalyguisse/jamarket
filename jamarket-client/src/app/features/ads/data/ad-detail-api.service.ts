import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { AdDetail } from '@core/models/ad-detail.model';
import { environment } from '../../../../environments/environment';
import { type ApiAdResponse, mapAdToDetail } from './ad-api.mapper';

@Injectable({ providedIn: 'root' })
export class AdDetailApiService {
  private readonly http = inject(HttpClient);
  private readonly adsUrl = `${environment.apiUrl}/ads`;

  getById(id: string): Observable<AdDetail> {
    return this.http.get<ApiAdResponse>(`${this.adsUrl}/${id}`).pipe(
      map((response) => {
        const detail = mapAdToDetail(response);
        if (!detail) {
          throw new Error('Annonce invalide');
        }
        return detail;
      }),
    );
  }
}
