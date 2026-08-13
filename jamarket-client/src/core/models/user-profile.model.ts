export interface UserRole {
  id: number;
  label: string;
  rights: string[];
  deletedAt: string | null;
}

export interface UserProfile {
  id: number;
  name: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  deletedAt: string | null;
  role: UserRole;
}

export interface UpdateAdminProfilePayload {
  name: string;
  lastName: string;
}

export interface ChangeAdminPasswordPayload {
  currentPassword: string;
  newPassword: string;
}
