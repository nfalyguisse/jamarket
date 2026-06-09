export interface VehicleCard {
  id: string;
  title: string;
  price: number;
  mileageKm: number;
  year: number;
  transmission: string;
  fuelType?: string;
  imageUrl: string;
  imageAlt: string;
  badge?: string;
}
