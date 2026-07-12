import type { UserProfile } from './user-profile.model';

export interface AdminUser extends UserProfile {}

export interface AdminUserRole {
  id: number;
  label: string;
}

export interface AdminUsersFilters {
  search?: string;
  roleId?: number;
  garageOnly?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAdminUsers {
  data: AdminUser[];
  meta: PaginatedMeta;
}

export const CUSTOMER_ROLE_ID = 3;
export const ADMIN_ROLE_ID = 1;
export const EMPLOYEE_ROLE_ID = 2;

export const ROLE_LABELS: Record<number, string> = {
  [ADMIN_ROLE_ID]: 'Administrateur',
  [EMPLOYEE_ROLE_ID]: 'Employé',
  [CUSTOMER_ROLE_ID]: 'Client',
};
