import { User, Trip, SystemSettings, AdminMetrics, DriverWithStats } from '../types';

const API_BASE = '/api';

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

export const api = {
  // Auth
  async getDemoUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    if (!res.ok) throw new Error('Failed to fetch demo users');
    return res.json();
  },

  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: password || 'admin123' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(data: any): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateMe(data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
  },

  async getDriverQueue(): Promise<Trip[]> {
    const res = await fetch(`${API_BASE}/trips/queue`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch queue');
    return res.json();
  },

  async getActiveTrip(): Promise<Trip | null> {
    const res = await fetch(`${API_BASE}/trips/active`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async createTrip(data: {
    pickupAddress: string;
    pickupCoords: { lat: number; lng: number };
    destinationAddress: string;
    destinationCoords: { lat: number; lng: number };
    distanceKm: number;
    notes?: string;
  }): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create trip' }));
      throw new Error(err.error || 'Failed to create trip');
    }
    return res.json();
  },

  async acceptTrip(tripId: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/accept`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to accept trip' }));
      throw new Error(err.error || 'Failed to accept trip');
    }
    return res.json();
  },

  async pickupCustomer(tripId: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/pickup`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to mark picked up' }));
      throw new Error(err.error || 'Failed to mark picked up');
    }
    return res.json();
  },

  async dropoffCustomer(tripId: string, amountPaid: number): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/dropoff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amountPaid }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to complete drop off' }));
      throw new Error(err.error || 'Failed to complete drop off');
    }
    return res.json();
  },

  async cancelTrip(tripId: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to cancel trip' }));
      throw new Error(err.error || 'Failed to cancel trip');
    }
    return res.json();
  },

  async rateTrip(tripId: string, rating: number): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/rate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to rate trip' }));
      throw new Error(err.error || 'Failed to rate trip');
    }
    return res.json();
  },

  // Admin
  async getAdminMetrics(): Promise<AdminMetrics> {
    const res = await fetch(`${API_BASE}/admin/metrics`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getAdminDrivers(): Promise<DriverWithStats[]> {
    const res = await fetch(`${API_BASE}/admin/drivers`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch driver list');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },
};
