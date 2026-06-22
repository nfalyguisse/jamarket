export interface VehicleCard {
  id: string;
  title: string;
  brandLabel?: string;
  modelLabel?: string;
  price: number;
  mileageKm: number;
  year: number;
  transmission: string;
  fuelType?: string;
  imageUrl: string;
  imageAlt: string;
  badge?: string;
}
