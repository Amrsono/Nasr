export type UserRole = 'admin' | 'driver' | 'customer';

export type TripStatus = 'REQUESTED' | 'ACCEPTED' | 'PICKED_UP' | 'DROPPED_OFF' | 'CANCELLED';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  carDetails?: {
    model: string;
    plate: string;
    color: string;
  };
  isOnline?: boolean;
  currentLocation?: LocationCoords;
  totalTrips?: number;
  totalEarnings?: number;
  rating?: number;
  createdAt: string;
}

export interface Trip {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverCar?: string | null;
  pickupAddress: string;
  pickupCoords: LocationCoords;
  destinationAddress: string;
  destinationCoords: LocationCoords;
  distanceKm: number;
  estimatedFare: number;
  finalFare?: number | null;
  currency: string;
  status: TripStatus;
  notes?: string;
  createdAt: string;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  droppedOffAt?: string | null;
  cancelledAt?: string | null;
  customerRating?: number | null;
}

export interface SystemSettings {
  googleMapsApiKey: string;
  baseFare: number;
  perKmRate: number;
  currency: string;
  companyName: string;
}
