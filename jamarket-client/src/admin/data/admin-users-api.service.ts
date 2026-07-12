import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AdminUser,
  AdminUserRole,
  AdminUsersFilters,
  PaginatedAdminUsers,
} from '@core/models/admin-user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;

  getUsers(filters: AdminUsersFilters = {}): Observable<PaginatedAdminUsers> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.roleId !== undefined) {
      params = params.set('roleId', filters.roleId.toString());
    }
    if (filters.garageOnly !== undefined) {
      params = params.set('garageOnly', filters.garageOnly.toString());
    }
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive.toString());
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<PaginatedAdminUsers>(this.baseUrl, { params });
  }

  getAssignableRoles(): Observable<AdminUserRole[]> {
    return this.http.get<AdminUserRole[]>(`${this.baseUrl}/roles`);
  }

  banUser(id: number, banned: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}/ban`, { banned });
  }

  updateRole(id: number, roleId: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}/role`, { roleId });
  }
}
