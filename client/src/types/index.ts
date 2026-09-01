export type UserRole = 'admin' | 'driver' | 'customer';

export type TripStatus = 'REQUESTED' | 'ACCEPTED' | 'ARRIVED' | 'PICKED_UP' | 'DROPPED_OFF' | 'CANCELLED';

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
  arrivedAt?: string | null;
  pickedUpAt?: string | null;
  droppedOffAt?: string | null;
  cancelledAt?: string | null;
  customerRating?: number | null;
}

export interface FixedRoutePrice {
  id: string;
  pickupName: string;
  pickupAddress?: string;
  destinationName: string;
  destinationAddress?: string;
  price: number;
  isActive: boolean;
  isBidirectional?: boolean;
  createdAt?: string;
}

export interface SystemSettings {
  googleMapsApiKey: string;
  baseFare: number;
  perKmRate: number;
  currency: string;
  companyName: string;
  fixedRoutes?: FixedRoutePrice[];
}

export interface AdminMetrics {
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  avgTripCost: number;
  totalDistance: number;
  totalDrivers: number;
  onlineDrivers: number;
  totalCustomers: number;
  last7Days: { date: string; trips: number; revenue: number }[];
}

export interface DriverWithStats extends User {
  completedTripsCount: number;
  totalEarned: number;
  activeTrip: Trip | null;
}
