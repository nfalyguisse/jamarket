import { RightEnum } from '../../generated/prisma/client';

export function isCustomerOnlyRole(rights: RightEnum[]): boolean {
  return rights.length === 1 && rights[0] === RightEnum.CUSTOMER;
}

export const RIGHT_LABELS: Record<RightEnum, string> = {
  [RightEnum.CREATE_AD]: 'Créer des annonces',
  [RightEnum.DELETE_AD]: 'Supprimer des annonces',
  [RightEnum.MANAGE_USER]: 'Gérer les utilisateurs',
  [RightEnum.CUSTOMER]: 'Accès client',
  [RightEnum.ADMIN]: 'Accès back-office',
  [RightEnum.SUPER_ADMIN]: 'Super administrateur',
};
