import type { FuelType } from './ad-detail.model';

export interface AdminAdImage {
  id: number;
  url: string;
}

export interface AdminAdVehicule {
  id: number;
  modelId: number;
  brandId: number;
  brandLabel: string;
  modelLabel: string;
  kilometer: number;
  year: number;
  doorsNumber: number;
  power: string;
  fuel: FuelType;
  color: string;
  vehiculeTypeId: number;
  vehiculeTypeLabel: string;
  images: AdminAdImage[];
}

export interface AdminAdSeller {
  id: number;
  name: string;
  lastName: string;
  email: string;
}

export interface AdminAd {
  id: number;
  label: string;
  description: string;
  price: number;
  isActive: boolean;
  isSold: boolean;
  isArchived: boolean;
  createdAt: string;
  vehicule: AdminAdVehicule;
  seller?: AdminAdSeller;
}

export type AdminAdListScope = 'mine' | 'all';

export interface AdminFormReferences {
  brands: { id: number; label: string }[];
  models: { id: number; label: string; brandId: number }[];
  vehiculeTypes: { id: number; label: string }[];
  fuelTypes: FuelType[];
}

export interface CreateVehiculePayload {
  modelId: number;
  kilometer: number;
  year: number;
  doorsNumber: number;
  power: string;
  fuel: FuelType;
  color: string;
  vehiculeTypeId: number;
}

export interface CreateAdPayload {
  label: string;
  description: string;
  price: number;
  vehiculeId: number;
  isActive?: boolean;
}

export interface UpdateAdPayload {
  label?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
}

export interface UpdateVehiculePayload {
  modelId?: number;
  kilometer?: number;
  year?: number;
  doorsNumber?: number;
  power?: string;
  fuel?: FuelType;
  color?: string;
  vehiculeTypeId?: number;
}
