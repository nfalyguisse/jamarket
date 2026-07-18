import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AdminRole,
  AvailableRight,
  CreateRolePayload,
  UpdateRolePayload,
} from '@core/models/admin-role.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminRolesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/roles`;

  getRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(this.baseUrl);
  }

  getAvailableRights(): Observable<AvailableRight[]> {
    return this.http.get<AvailableRight[]>(`${this.baseUrl}/available-rights`);
  }

  getRole(id: number): Observable<AdminRole> {
    return this.http.get<AdminRole>(`${this.baseUrl}/${id}`);
  }

  createRole(payload: CreateRolePayload): Observable<AdminRole> {
    return this.http.post<AdminRole>(this.baseUrl, payload);
  }

  updateRole(id: number, payload: UpdateRolePayload): Observable<AdminRole> {
    return this.http.patch<AdminRole>(`${this.baseUrl}/${id}`, payload);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
