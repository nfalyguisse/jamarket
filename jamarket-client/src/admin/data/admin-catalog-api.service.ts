import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CatalogBrand {
  id: number;
  label: string;
}

export interface CatalogModel {
  id: number;
  label: string;
  brandId: number;
}

export interface CatalogVehiculeType {
  id: number;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly catalogUrl = `${environment.apiUrl}/catalog`;

  createBrand(label: string): Observable<CatalogBrand> {
    return this.http.post<CatalogBrand>(`${this.catalogUrl}/brands`, { label });
  }

  createModel(label: string, brandId: number): Observable<CatalogModel> {
    return this.http.post<CatalogModel>(`${this.catalogUrl}/models`, { label, brandId });
  }

  createVehiculeType(label: string): Observable<CatalogVehiculeType> {
    return this.http.post<CatalogVehiculeType>(`${this.catalogUrl}/vehicule-types`, { label });
  }
}
