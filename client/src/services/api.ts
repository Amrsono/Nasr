import { User, Trip, SystemSettings, AdminMetrics, DriverWithStats } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('nasr_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// LOCAL CLIENT DATABASE (Fallback for Static Vercel Hosting)
// -------------------------------------------------------------
interface LocalDB {
  users: User[];
  trips: Trip[];
  settings: SystemSettings;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'Owner Admin',
    email: 'admin@nasr.com',
    role: 'admin',
    phone: '+20 100 000 0001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_driver1',
    name: 'Driver 1 - Ahmed',
    email: 'driver1@nasr.com',
    role: 'driver',
    phone: '+20 101 111 2221',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    carDetails: {
      model: 'Toyota Corolla (2022)',
      plate: '1234 ABC',
      color: 'White',
    },
    isOnline: true,
    currentLocation: { lat: 30.0444, lng: 31.2357 },
    totalTrips: 0,
    totalEarnings: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_driver2',
    name: 'Driver 2 - Mahmoud',
    email: 'driver2@nasr.com',
    role: 'driver',
    phone: '+20 102 222 3332',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    carDetails: {
      model: 'Hyundai Elantra (2021)',
      plate: '5678 XYZ',
      color: 'Silver',
    },
    isOnline: true,
    currentLocation: { lat: 30.0626, lng: 31.2497 },
    totalTrips: 0,
    totalEarnings: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_driver3',
    name: 'Driver 3 - Tarek',
    email: 'driver3@nasr.com',
    role: 'driver',
    phone: '+20 103 333 4443',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    carDetails: {
      model: 'Nissan Sunny (2023)',
      plate: '9012 EFG',
      color: 'Black',
    },
    isOnline: true,
    currentLocation: { lat: 30.0131, lng: 31.2089 },
    totalTrips: 0,
    totalEarnings: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_driver4',
    name: 'Driver 4 - Youssef',
    email: 'driver4@nasr.com',
    role: 'driver',
    phone: '+20 104 444 5554',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    carDetails: {
      model: 'Kia Cerato (2020)',
      plate: '3456 JKL',
      color: 'Blue',
    },
    isOnline: true,
    currentLocation: { lat: 30.0888, lng: 31.2988 },
    totalTrips: 0,
    totalEarnings: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_amrsono',
    name: 'Amrsono',
    email: 'amrsono@nasr.com',
    role: 'customer',
    phone: '+20 100 123 4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    totalTrips: 0,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  googleMapsApiKey: '',
  baseFare: 20,
  perKmRate: 6.5,
  currency: 'EGP',
  companyName: 'Nasr Ride',
};

function getLocalDB(): LocalDB {
  const raw = localStorage.getItem('nasr_local_db');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  const initial: LocalDB = {
    users: DEFAULT_USERS,
    trips: [],
    settings: DEFAULT_SETTINGS,
  };
  localStorage.setItem('nasr_local_db', JSON.stringify(initial));
  return initial;
}

function saveLocalDB(db: LocalDB) {
  localStorage.setItem('nasr_local_db', JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('nasr:db_updated'));
}

function getCurrentUserId(): string | null {
  const token = localStorage.getItem('nasr_token');
  if (!token) return null;
  return localStorage.getItem('nasr_user_id') || 'user_admin';
}

// -------------------------------------------------------------
// UNIVERSAL API CLIENT
// -------------------------------------------------------------
export const api = {
  async getDemoUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-users`);
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}
    return getLocalDB().users;
  },

  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: password || 'admin123' }),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        const data = await res.json();
        localStorage.setItem('nasr_user_id', data.user.id);
        return data;
      }
    } catch {}

    // Fallback: Local Authentication
    const db = getLocalDB();
    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      if (cleanEmail === 'admin@nasr.com') {
        user = DEFAULT_USERS[0];
      } else if (cleanEmail.startsWith('driver')) {
        user = DEFAULT_USERS.find((u) => u.email === cleanEmail) || DEFAULT_USERS[1];
      } else {
        user = {
          id: `user_${Date.now()}`,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'customer',
          phone: '+20 100 000 0000',
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        saveLocalDB(db);
      }
    }

    const token = `token_${user.id}_${Date.now()}`;
    localStorage.setItem('nasr_user_id', user.id);
    return { user, token };
  },

  async register(data: any): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        const resData = await res.json();
        localStorage.setItem('nasr_user_id', resData.user.id);
        return resData;
      }
    } catch {}

    // Fallback: Local Registration
    const db = getLocalDB();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: data.name || 'User',
      email: cleanEmail,
      role: data.role || 'customer',
      phone: data.phone || '',
      avatar: data.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80`,
      carDetails: data.carDetails,
      isOnline: data.role === 'driver',
      totalTrips: 0,
      totalEarnings: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveLocalDB(db);

    const token = `token_${newUser.id}_${Date.now()}`;
    localStorage.setItem('nasr_user_id', newUser.id);
    return { user: newUser, token };
  },

  async getMe(): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const user = db.users.find((u) => u.id === uid) || db.users[0];
    return user;
  },

  async updateMe(data: Partial<User>): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const idx = db.users.findIndex((u) => u.id === uid);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...data };
      saveLocalDB(db);
      return db.users[idx];
    }
    return db.users[0];
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    try {
      const res = await fetch(`${API_BASE}/trips`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    return getLocalDB().trips;
  },

  async getDriverQueue(): Promise<Trip[]> {
    try {
      const res = await fetch(`${API_BASE}/trips/queue`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    return db.trips.filter((t) => t.status === 'REQUESTED');
  },

  async getActiveTrip(): Promise<Trip | null> {
    try {
      const res = await fetch(`${API_BASE}/trips/active`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const active = db.trips.find(
      (t) => (t.customerId === uid || t.driverId === uid) && ['REQUESTED', 'ACCEPTED', 'PICKED_UP'].includes(t.status)
    );
    return active || null;
  },

  async createTrip(data: {
    pickupAddress: string;
    pickupCoords: { lat: number; lng: number };
    destinationAddress: string;
    destinationCoords: { lat: number; lng: number };
    distanceKm: number;
    notes?: string;
  }): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const user = db.users.find((u) => u.id === uid) || db.users[5];
    const settings = db.settings;
    const dist = data.distanceKm || 5.0;
    const estFare = Math.round(settings.baseFare + dist * settings.perKmRate);

    const newTrip: Trip = {
      id: `trip_${Date.now().toString(36)}`,
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone || '+20 100 123 4567',
      driverId: null,
      driverName: null,
      driverPhone: null,
      driverCar: null,
      pickupAddress: data.pickupAddress,
      pickupCoords: data.pickupCoords,
      destinationAddress: data.destinationAddress,
      destinationCoords: data.destinationCoords,
      distanceKm: dist,
      estimatedFare: estFare,
      finalFare: null,
      currency: settings.currency,
      status: 'REQUESTED',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      pickedUpAt: null,
      droppedOffAt: null,
      cancelledAt: null,
      customerRating: null,
    };

    db.trips.unshift(newTrip);
    saveLocalDB(db);
    return newTrip;
  },

  async acceptTrip(tripId: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/accept`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const driver = db.users.find((u) => u.id === uid) || db.users[1];
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverCar: driver.carDetails ? `${driver.carDetails.model} - ${driver.carDetails.plate}` : 'Toyota Corolla',
      status: 'ACCEPTED',
      acceptedAt: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  async pickupCustomer(tripId: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/pickup`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      status: 'PICKED_UP',
      pickedUpAt: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  async dropoffCustomer(tripId: string, amountPaid: number): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/dropoff`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amountPaid }),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    const trip = db.trips[idx];
    const finalAmount = amountPaid || trip.estimatedFare;

    db.trips[idx] = {
      ...trip,
      status: 'DROPPED_OFF',
      finalFare: finalAmount,
      droppedOffAt: new Date().toISOString(),
    };

    // Update driver earnings
    if (trip.driverId) {
      const dIdx = db.users.findIndex((u) => u.id === trip.driverId);
      if (dIdx !== -1) {
        db.users[dIdx].totalTrips = (db.users[dIdx].totalTrips || 0) + 1;
        db.users[dIdx].totalEarnings = (db.users[dIdx].totalEarnings || 0) + finalAmount;
      }
    }

    saveLocalDB(db);
    return db.trips[idx];
  },

  async cancelTrip(tripId: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  async rateTrip(tripId: string, rating: number): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/rate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rating }),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      customerRating: rating,
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  // Admin
  async getAdminMetrics(): Promise<AdminMetrics> {
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const completed = db.trips.filter((t) => t.status === 'DROPPED_OFF');
    const active = db.trips.filter((t) => ['REQUESTED', 'ACCEPTED', 'PICKED_UP'].includes(t.status));
    const revenue = completed.reduce((sum, t) => sum + (t.finalFare || t.estimatedFare || 0), 0);
    const distance = completed.reduce((sum, t) => sum + (t.distanceKm || 0), 0);

    return {
      totalRevenue: revenue,
      totalTrips: completed.length + active.length,
      completedTrips: completed.length,
      activeTrips: active.length,
      cancelledTrips: db.trips.filter((t) => t.status === 'CANCELLED').length,
      avgTripCost: completed.length > 0 ? Math.round(revenue / completed.length) : 0,
      totalDistance: distance,
      totalDrivers: db.users.filter((u) => u.role === 'driver').length,
      onlineDrivers: db.users.filter((u) => u.role === 'driver' && u.isOnline).length,
      totalCustomers: db.users.filter((u) => u.role === 'customer').length,
      last7Days: [],
    };
  },

  async getAdminDrivers(): Promise<DriverWithStats[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/drivers`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const drivers = db.users.filter((u) => u.role === 'driver');
    return drivers.map((d) => ({
      ...d,
      completedTripsCount: d.totalTrips || 0,
      totalEarned: d.totalEarnings || 0,
      activeTrip: db.trips.find((t) => t.driverId === d.id && ['ACCEPTED', 'PICKED_UP'].includes(t.status)) || null,
    }));
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    return getLocalDB().settings;
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    db.settings = { ...db.settings, ...data };
    saveLocalDB(db);
    return db.settings;
  },
};
