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
  isActive: boolean;
  roleId: number;
  createdAt: string;
  deletedAt: string | null;
  role: UserRole;
}
