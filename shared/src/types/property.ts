export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  MAINTENANCE = 'MAINTENANCE',
  DELISTED = 'DELISTED',
}

export interface Property {
  id: number;
  ownerId: number;
  title: string;
  description: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  priceEth: string;
  depositEth: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  status: PropertyStatus;
  isApproved: boolean;
  qrCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}
