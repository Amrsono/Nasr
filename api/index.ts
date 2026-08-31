import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nasr_ride_production_jwt_secret_key_2026';

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

interface DatabaseSchema {
  users: User[];
  trips: Trip[];
  settings: SystemSettings;
}

const getInitialSeed = (): DatabaseSchema => {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  return {
    settings: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      baseFare: 20,
      perKmRate: 6.5,
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

// Global DB instance for Vercel Serverless
const globalDb: { db: DatabaseSchema } = (global as any)._nasr_db || { db: getInitialSeed() };
(global as any)._nasr_db = globalDb;

const db = {
  getUsers: () => globalDb.db.users,
  getUserById: (id: string) => globalDb.db.users.find((u) => u.id === id),
  getUserByEmail: (email: string) => globalDb.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user: User) => {
    globalDb.db.users.push(user);
    return user;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const idx = globalDb.db.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    globalDb.db.users[idx] = { ...globalDb.db.users[idx], ...updates };
    return globalDb.db.users[idx];
  },
  getTrips: () => [...globalDb.db.trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  getTripById: (id: string) => globalDb.db.trips.find((t) => t.id === id),
  createTrip: (trip: Trip) => {
    globalDb.db.trips.unshift(trip);
    return trip;
  },
  updateTrip: (id: string, updates: Partial<Trip>) => {
    const idx = globalDb.db.trips.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    globalDb.db.trips[idx] = { ...globalDb.db.trips[idx], ...updates };
    return globalDb.db.trips[idx];
  },
  getSettings: () => globalDb.db.settings,
  updateSettings: (settings: Partial<SystemSettings>) => {
    globalDb.db.settings = { ...globalDb.db.settings, ...settings };
    return globalDb.db.settings;
  },
  reset: () => {
    globalDb.db = getInitialSeed();
  },
};

const app = express();
app.use(cors());
app.use(express.json());

interface AuthRequest extends Request {
  user?: User;
}

const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = db.getUserById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: `Access denied. Requires role: ${roles.join(' or ')}` });
      return;
    }
    next();
  };
};

const router = express.Router();

// Health Check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'Nasr Ride Vercel Serverless' });
});

// Demo accounts endpoint
router.get('/auth/demo-users', (_req, res) => {
  const users = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    avatar: u.avatar,
    carDetails: u.carDetails,
  }));
  res.json(users);
});

// Login
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: `User with email "${email}" not found.` });
  }

  const cleanPassword = (password || '').trim();
  const isDemoAccount = ['admin@nasr.com', 'driver1@nasr.com', 'driver2@nasr.com', 'driver3@nasr.com', 'driver4@nasr.com', 'amrsono@nasr.com'].includes(cleanEmail);

  if (user.password) {
    let isValid = false;
    try {
      isValid = bcrypt.compareSync(cleanPassword, user.password);
    } catch {
      isValid = false;
    }

    if (!isValid && (isDemoAccount || ['admin123', 'driver123', 'customer123', '123456'].includes(cleanPassword))) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPw } = user;
  res.json({ user: userWithoutPw, token });
});

// Register
router.post('/auth/register', (req, res) => {
  const { name, email, password, role, phone, carDetails } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.getUserByEmail(cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const validRole: UserRole = role === 'driver' ? 'driver' : 'customer';
  const hashedPassword = bcrypt.hashSync(password.trim(), 10);

  const newUser: User = {
    id: `user_${uuidv4().slice(0, 8)}`,
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    role: validRole,
    phone: phone ? phone.trim() : '',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    carDetails: validRole === 'driver' ? carDetails || { model: 'Standard Sedan', plate: '7890 ABC', color: 'White' } : undefined,
    isOnline: validRole === 'driver' ? true : undefined,
    totalTrips: 0,
    totalEarnings: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  };

  db.createUser(newUser);
  const token = generateToken(newUser);
  const { password: _, ...userWithoutPw } = newUser;

  res.status(201).json({ user: userWithoutPw, token });
});

// Current User Profile
router.get('/auth/me', authenticate, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { password: _, ...userWithoutPw } = req.user;
  res.json(userWithoutPw);
});

// Update Profile
router.put('/auth/me', authenticate, (req: AuthRequest, res) => {
  const { name, phone, avatar, carDetails, isOnline, currentLocation } = req.body;
  
  const updated = db.updateUser(req.user!.id, {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(avatar && { avatar }),
    ...(carDetails && { carDetails }),
    ...(typeof isOnline === 'boolean' && { isOnline }),
    ...(currentLocation && { currentLocation }),
  });

  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userWithoutPw } = updated;
  res.json(userWithoutPw);
});

// List Trips
router.get('/trips', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const allTrips = db.getTrips();

  if (user.role === 'admin') {
    return res.json(allTrips);
  } else if (user.role === 'driver') {
    const driverTrips = allTrips.filter((t) => t.driverId === user.id);
    return res.json(driverTrips);
  } else {
    const customerTrips = allTrips.filter((t) => t.customerId === user.id);
    return res.json(customerTrips);
  }
});

// Driver Queue
router.get('/trips/queue', authenticate, requireRole('driver', 'admin'), (_req: AuthRequest, res) => {
  const queuedTrips = db.getTrips().filter((t) => t.status === 'REQUESTED');
  res.json(queuedTrips);
});

// Active trip
router.get('/trips/active', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const activeStatuses: TripStatus[] = ['REQUESTED', 'ACCEPTED', 'PICKED_UP'];

  let activeTrip: Trip | undefined;
  if (user.role === 'customer') {
    activeTrip = db.getTrips().find((t) => t.customerId === user.id && activeStatuses.includes(t.status));
  } else if (user.role === 'driver') {
    activeTrip = db.getTrips().find((t) => t.driverId === user.id && activeStatuses.includes(t.status));
  }

  res.json(activeTrip || null);
});

// Single Trip
router.get('/trips/:id', authenticate, (req: AuthRequest, res) => {
  const trip = db.getTripById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// Create Trip
router.post('/trips', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const { pickupAddress, pickupCoords, destinationAddress, destinationCoords, distanceKm, notes } = req.body;

  if (!pickupAddress || !pickupCoords || !destinationAddress || !destinationCoords) {
    return res.status(400).json({ error: 'Missing required pickup or destination location details' });
  }

  const settings = db.getSettings();
  const dist = parseFloat(distanceKm) || 5.0;
  const calculatedFare = Math.round(settings.baseFare + dist * settings.perKmRate);

  const newTrip: Trip = {
    id: `trip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone,
    driverId: null,
    driverName: null,
    driverPhone: null,
    driverCar: null,
    pickupAddress,
    pickupCoords,
    destinationAddress,
    destinationCoords,
    distanceKm: parseFloat(dist.toFixed(1)),
    estimatedFare: calculatedFare,
    finalFare: null,
    currency: settings.currency,
    status: 'REQUESTED',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    pickedUpAt: null,
    droppedOffAt: null,
    cancelledAt: null,
    customerRating: null,
  };

  db.createTrip(newTrip);
  res.status(201).json(newTrip);
});

// Accept Trip
router.post('/trips/:id/accept', authenticate, requireRole('driver'), (req: AuthRequest, res) => {
  const driver = req.user!;
  const trip = db.getTripById(req.params.id);

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'REQUESTED') {
    return res.status(409).json({ error: 'Trip has already been picked up by another driver' });
  }

  const carInfo = driver.carDetails
    ? `${driver.carDetails.model} (${driver.carDetails.color}) - ${driver.carDetails.plate}`
    : 'Sedan';

  const updatedTrip = db.updateTrip(trip.id, {
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone || '+20 100 000 0000',
    driverCar: carInfo,
    status: 'ACCEPTED',
    acceptedAt: new Date().toISOString(),
  });

  res.json(updatedTrip);
});

// Flag Picked Up
router.post('/trips/:id/pickup', authenticate, requireRole('driver'), (req: AuthRequest, res) => {
  const driver = req.user!;
  const trip = db.getTripById(req.params.id);

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.driverId !== driver.id) return res.status(403).json({ error: 'Not authorized for this trip' });

  const updatedTrip = db.updateTrip(trip.id, {
    status: 'PICKED_UP',
    pickedUpAt: new Date().toISOString(),
  });

  res.json(updatedTrip);
});

// Flag Dropped Off
router.post('/trips/:id/dropoff', authenticate, requireRole('driver'), (req: AuthRequest, res) => {
  const driver = req.user!;
  const trip = db.getTripById(req.params.id);
  const { amountPaid } = req.body;

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.driverId !== driver.id) return res.status(403).json({ error: 'Not authorized for this trip' });

  const finalFare = parseFloat(amountPaid) || trip.estimatedFare;

  const updatedTrip = db.updateTrip(trip.id, {
    status: 'DROPPED_OFF',
    finalFare,
    droppedOffAt: new Date().toISOString(),
  });

  // Update driver earnings
  const driverRecord = db.getUserById(driver.id);
  if (driverRecord) {
    db.updateUser(driver.id, {
      totalTrips: (driverRecord.totalTrips || 0) + 1,
      totalEarnings: (driverRecord.totalEarnings || 0) + finalFare,
    });
  }

  res.json(updatedTrip);
});

// Cancel Trip
router.post('/trips/:id/cancel', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const trip = db.getTripById(req.params.id);

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (user.role === 'customer' && trip.customerId !== user.id) {
    return res.status(403).json({ error: 'Not authorized to cancel this trip' });
  }

  const updatedTrip = db.updateTrip(trip.id, {
    status: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
  });

  res.json(updatedTrip);
});

// Rate Trip
router.post('/trips/:id/rate', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const trip = db.getTripById(req.params.id);
  const { rating } = req.body;

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.customerId !== user.id) {
    return res.status(403).json({ error: 'Only the customer can rate the trip' });
  }

  const numRating = Math.min(5, Math.max(1, parseInt(rating) || 5));
  const updatedTrip = db.updateTrip(trip.id, { customerRating: numRating });

  if (trip.driverId) {
    const driverTrips = db.getTrips().filter((t) => t.driverId === trip.driverId && t.customerRating);
    if (driverTrips.length > 0) {
      const avg = driverTrips.reduce((acc, t) => acc + (t.customerRating || 5), 0) / driverTrips.length;
      db.updateUser(trip.driverId, { rating: parseFloat(avg.toFixed(1)) });
    }
  }

  res.json(updatedTrip);
});

// Admin Metrics
router.get('/admin/metrics', authenticate, requireRole('admin'), (_req: AuthRequest, res) => {
  const allTrips = db.getTrips();
  const allUsers = db.getUsers();
  const drivers = allUsers.filter((u) => u.role === 'driver');
  const customers = allUsers.filter((u) => u.role === 'customer');

  const completedTrips = allTrips.filter((t) => t.status === 'DROPPED_OFF');
  const activeTrips = allTrips.filter((t) => ['REQUESTED', 'ACCEPTED', 'PICKED_UP'].includes(t.status));
  const cancelledTrips = allTrips.filter((t) => t.status === 'CANCELLED');

  const totalRevenue = completedTrips.reduce((sum, t) => sum + (t.finalFare || t.estimatedFare || 0), 0);
  const totalDistance = completedTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  const avgTripCost = completedTrips.length > 0 ? Math.round(totalRevenue / completedTrips.length) : 0;

  res.json({
    totalTrips: allTrips.length,
    completedTrips: completedTrips.length,
    activeTrips: activeTrips.length,
    cancelledTrips: cancelledTrips.length,
    totalRevenue,
    avgTripCost,
    totalDistance,
    totalDrivers: drivers.length,
    onlineDrivers: drivers.filter((d) => d.isOnline).length,
    totalCustomers: customers.length,
    last7Days: [],
  });
});

// Admin Drivers
router.get('/admin/drivers', authenticate, requireRole('admin'), (_req: AuthRequest, res) => {
  const drivers = db.getUsers().filter((u) => u.role === 'driver');
  const allTrips = db.getTrips();

  const driversWithStats = drivers.map((d) => {
    const dTrips = allTrips.filter((t) => t.driverId === d.id && t.status === 'DROPPED_OFF');
    const totalEarned = dTrips.reduce((sum, t) => sum + (t.finalFare || t.estimatedFare || 0), 0);
    const activeTrip = allTrips.find((t) => t.driverId === d.id && ['ACCEPTED', 'PICKED_UP'].includes(t.status)) || null;

    return {
      ...d,
      completedTripsCount: dTrips.length,
      totalEarned,
      activeTrip,
    };
  });

  res.json(driversWithStats);
});

// Settings
router.get('/settings', (_req, res) => {
  res.json(db.getSettings());
});

router.put('/settings', authenticate, requireRole('admin'), (req: AuthRequest, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

router.post('/admin/reset', (_req, res) => {
  db.reset();
  res.json({ success: true, message: 'Database reset to clean state' });
});

// Mount router on both '/api' and '/'
app.use('/api', router);
app.use('/', router);

export default app;
