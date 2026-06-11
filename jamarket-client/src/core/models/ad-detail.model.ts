export type FuelType = 'essence' | 'diesel' | 'electrique' | 'hybride';

export interface AdImage {
  id: number;
  url: string;
}

export interface AdSeller {
  id: number;
  name: string;
  lastName: string;
  email: string;
}

export interface AdVehiculeDetail {
  id: number;
  kilometer: number;
  year: number;
  doorsNumber: number;
  power: string;
  fuel: FuelType;
  color: string;
  vehiculeYear: number;
  brandLabel: string;
  modelLabel: string;
  vehiculeTypeLabel: string;
  images: AdImage[];
}

export interface AdDetail {
  id: number;
  label: string;
  description: string;
  price: number;
  isActive: boolean;
  isSold: boolean;
  createdAt: string;
  vehicule: AdVehiculeDetail;
  seller: AdSeller | null;
}

export interface AdSpecItem {
  key: string;
  label: string;
  value: string;
}
