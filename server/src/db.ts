import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { User, Trip, SystemSettings } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  trips: Trip[];
  settings: SystemSettings;
}

// Initial Production Seed Data
const getInitialSeed = (): DatabaseSchema => {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  return {
    settings: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      baseFare: 20, // base fare in EGP
      perKmRate: 6.5, // 6.5 EGP per KM
      currency: 'EGP',
      companyName: 'Nasr Ride',
    },
    users: [
      {
        id: 'user_admin',
        name: 'Owner Admin',
        email: 'admin@nasr.com',
        password: hash('admin123'),
        role: 'admin',
        phone: '+20 100 000 0001',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_driver1',
        name: 'Driver 1 - Ahmed',
        email: 'driver1@nasr.com',
        password: hash('driver123'),
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
        password: hash('driver123'),
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
        password: hash('driver123'),
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
        password: hash('driver123'),
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
        password: hash('customer123'),
        role: 'customer',
        phone: '+20 100 123 4567',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        totalTrips: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    trips: [],
  };
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.settings) {
          this.data.settings = getInitialSeed().settings;
        }
      } catch (err) {
        console.error('Error reading db.json, re-seeding...', err);
        this.data = getInitialSeed();
        this.save();
      }
    } else {
      this.data = getInitialSeed();
      this.save();
    }
  }

  public resetToCleanSeed(): void {
    this.data = getInitialSeed();
    this.save();
  }

  public save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing db.json', err);
    }
  }

  // User Methods
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.save();
    return true;
  }

  // Trip Methods
  public getTrips(): Trip[] {
    return [...this.data.trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTripById(id: string): Trip | undefined {
    return this.data.trips.find((t) => t.id === id);
  }

  public createTrip(trip: Trip): Trip {
    this.data.trips.push(trip);
    this.save();
    return trip;
  }

  public updateTrip(id: string, updates: Partial<Trip>): Trip | undefined {
    const idx = this.data.trips.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.data.trips[idx] = { ...this.data.trips[idx], ...updates };
    this.save();
    return this.data.trips[idx];
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
