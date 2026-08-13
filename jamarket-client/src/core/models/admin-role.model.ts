export interface AdminRole {
  id: number;
  label: string;
  rights: string[];
  userCount: number;
  deletedAt: string | null;
}

export interface AvailableRight {
  value: string;
  label: string;
}

export interface CreateRolePayload {
  label: string;
  rights: string[];
}

export interface UpdateRolePayload {
  label?: string;
  rights?: string[];
}

export const RIGHT_LABELS: Record<string, string> = {
  CREATE_AD: 'Créer des annonces',
  DELETE_AD: 'Supprimer des annonces',
  MANAGE_USER: 'Gérer les utilisateurs',
  CUSTOMER: 'Accès client',
  ADMIN: 'Accès back-office',
  SUPER_ADMIN: 'Super administrateur',
};
