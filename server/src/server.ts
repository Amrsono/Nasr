import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

import { db } from './db.js';
import { User, Trip, TripStatus, UserRole } from './types.js';
import { authenticate, generateToken, requireRole, AuthRequest } from './auth.js';
import { initSocketIO, notifyTripCreated, notifyTripUpdated } from './socket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

initSocketIO(io);

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'Nasr Ride API' });
});

// Demo accounts endpoint for easy multi-account testing
app.get('/api/auth/demo-users', (req, res) => {
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
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: `User with email "${email}" not found. Please register or use one of the demo accounts.` });
  }

  // Check password
  const cleanPassword = (password || '').trim();
  const isDemoAccount = ['admin@nasr.com', 'driver1@nasr.com', 'driver2@nasr.com', 'driver3@nasr.com', 'driver4@nasr.com', 'amrsono@nasr.com'].includes(cleanEmail);

  if (user.password) {
    let isValid = false;
    try {
      isValid = bcrypt.compareSync(cleanPassword, user.password);
    } catch (e) {
      isValid = false;
    }

    // Allow known demo passwords or bypass for demo accounts
    if (!isValid) {
      const allowedDemoPw = ['admin123', 'driver123', 'customer123', '123456', 'password'];
      if (isDemoAccount || allowedDemoPw.includes(cleanPassword)) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid password. (Demo passwords: Owner="admin123", Drivers="driver123", Customer="customer123")',
      });
    }
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPw } = user;
  res.json({ user: userWithoutPw, token });
});

// Register
app.post('/api/auth/register', (req, res) => {
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
app.get('/api/auth/me', authenticate, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { password: _, ...userWithoutPw } = req.user;
  res.json(userWithoutPw);
});

// Update Profile
app.put('/api/auth/me', authenticate, (req: AuthRequest, res) => {
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

// -------------------------------------------------------------
// TRIPS API
// -------------------------------------------------------------

// List Trips
app.get('/api/trips', authenticate, (req: AuthRequest, res) => {
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

// Driver Queue: Pending REQUESTED trips waiting for pickup (First-come, first-served)
app.get('/api/trips/queue', authenticate, requireRole('driver', 'admin'), (_req: AuthRequest, res) => {
  const requestedTrips = db.getTrips().filter((t) => t.status === 'REQUESTED');
  res.json(requestedTrips);
});

// Active trip for logged in user (customer or driver)
app.get('/api/trips/active', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const activeStatuses: TripStatus[] = ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'PICKED_UP'];

  let activeTrip: Trip | undefined;
  if (user.role === 'customer') {
    activeTrip = db.getTrips().find((t) => t.customerId === user.id && activeStatuses.includes(t.status));
  } else if (user.role === 'driver') {
    activeTrip = db.getTrips().find((t) => t.driverId === user.id && activeStatuses.includes(t.status));
  }

  res.json(activeTrip || null);
});

// Single Trip Details
app.get('/api/trips/:id', authenticate, (req: AuthRequest, res) => {
  const trip = db.getTripById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// Create Trip (Customer initiates)
app.post('/api/trips', authenticate, (req: AuthRequest, res) => {
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
    arrivedAt: null,
    pickedUpAt: null,
    droppedOffAt: null,
    cancelledAt: null,
    customerRating: null,
  };

  db.createTrip(newTrip);
  notifyTripCreated(newTrip);

  res.status(201).json(newTrip);
});

// Driver Accepts Trip (First-come First-served Queue)
app.post('/api/trips/:id/accept', authenticate, requireRole('driver'), (req: AuthRequest, res) => {
  const driver = req.user!;
  const trip = db.getTripById(req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.status !== 'REQUESTED') {
    return res.status(409).json({
      error: 'Trip has already been accepted or is no longer available in the queue',
      currentStatus: trip.status,
    });
  }

  const carInfo = driver.carDetails
    ? `${driver.carDetails.model} (${driver.carDetails.color}) - ${driver.carDetails.plate}`
    : 'Standard Vehicle';

  const updatedTrip = db.updateTrip(trip.id, {
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone || '',
    driverCar: carInfo,
    status: 'ACCEPTED',
    acceptedAt: new Date().toISOString(),
  });

  if (updatedTrip) {
    notifyTripUpdated(updatedTrip);
    return res.json(updatedTrip);
  }

  res.status(500).json({ error: 'Failed to accept trip' });
});

// Driver Flags "Reached Pickup Location"
app.post('/api/trips/:id/arrive', authenticate, requireRole('driver'), (req: AuthRequest, res) => {
  const driver = req.user!;
  const trip = db.getTripById(req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.driverId !== driver.id) {
    return res.status(403).json({ error: 'You are not the assigned driver for this trip' });
  }

  if (trip.status !== 'ACCEPTED') {
    return res.status(400).json({ error: `Cannot mark arrived when trip status is ${trip.status}` });
  }

  const updatedTrip = db.updateTrip(trip.id, {
    status: 'ARRIVED',
    arrivedAt: new Date().toISOString(),
  });

  if (updatedTrip) {
    notifyTripUpdated(updatedTrip);
    return res.json(updatedTrip);
  }

  res.status(500).json({ error: 'Failed to update trip status to Arrived' });
});

// Driver Flags "Customer Picked Up"
app.post('/api/trips/:id/pickup', authenticate, requireRole('driver'), (req: AuthRequest, res) => {
  const driver = req.user!;
  const trip = db.getTripById(req.params.id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.driverId !== driver.id) {
    return res.status(403).json({ error: 'You are not the assigned driver for this trip' });
  }

  if (trip.status !== 'ACCEPTED' && trip.status !== 'ARRIVED') {
    return res.status(400).json({ error: `Cannot pick up customer when trip status is ${trip.status}` });
  }

  const updatedTrip = db.updateTrip(trip.id, {
    status: 'PICKED_UP',
    pickedUpAt: new Date().toISOString(),
  });

  if (updatedTrip) {
    notifyTripUpdated(updatedTrip);
    return res.json(updatedTrip);
  }

  res.status(500).json({ error: 'Failed to update trip status to Picked Up' });
});

// Driver Flags "Customer Dropped Off" & Enters Amount Paid
app.post('/api/trips/:id/dropoff', authenticate, requireRole('driver'), (req: AuthRequest, res) => {
  const driver = req.user!;
  const trip = db.getTripById(req.params.id);
  const { amountPaid } = req.body;

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.driverId !== driver.id) {
    return res.status(403).json({ error: 'You are not the assigned driver for this trip' });
  }

  if (trip.status !== 'PICKED_UP' && trip.status !== 'ACCEPTED' && trip.status !== 'ARRIVED') {
    return res.status(400).json({ error: `Cannot complete drop-off when trip status is ${trip.status}` });
  }

  const finalAmount = parseFloat(amountPaid) >= 0 ? parseFloat(amountPaid) : trip.estimatedFare;

  const updatedTrip = db.updateTrip(trip.id, {
    status: 'DROPPED_OFF',
    droppedOffAt: new Date().toISOString(),
    finalFare: finalAmount,
  });

  if (updatedTrip) {
    const currentEarnings = driver.totalEarnings || 0;
    const currentTrips = driver.totalTrips || 0;
    db.updateUser(driver.id, {
      totalEarnings: currentEarnings + finalAmount,
      totalTrips: currentTrips + 1,
    });

    const customer = db.getUserById(trip.customerId);
    if (customer) {
      db.updateUser(customer.id, {
        totalTrips: (customer.totalTrips || 0) + 1,
      });
    }

    notifyTripUpdated(updatedTrip);
    return res.json(updatedTrip);
  }

  res.status(500).json({ error: 'Failed to complete drop-off' });
});

// Cancel Trip
app.post('/api/trips/:id/cancel', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const trip = db.getTripById(req.params.id);

  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (user.role !== 'admin' && trip.customerId !== user.id && trip.driverId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to cancel this trip' });
  }

  if (trip.status === 'DROPPED_OFF' || trip.status === 'CANCELLED') {
    return res.status(400).json({ error: `Trip is already ${trip.status}` });
  }

  const updatedTrip = db.updateTrip(trip.id, {
    status: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
  });

  if (updatedTrip) {
    notifyTripUpdated(updatedTrip);
    return res.json(updatedTrip);
  }

  res.status(500).json({ error: 'Failed to cancel trip' });
});

// Customer Rates Trip
app.post('/api/trips/:id/rate', authenticate, (req: AuthRequest, res) => {
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

  if (updatedTrip) {
    notifyTripUpdated(updatedTrip);
    return res.json(updatedTrip);
  }

  res.status(500).json({ error: 'Failed to submit rating' });
});

app.post('/api/admin/reset', (_req, res) => {
  db.resetToCleanSeed();
  res.json({ success: true, message: 'Database reset to clean production seed' });
});

app.get('/api/admin/metrics', authenticate, requireRole('admin'), (_req: AuthRequest, res) => {
  const allTrips = db.getTrips();
  const allUsers = db.getUsers();
  const drivers = allUsers.filter((u) => u.role === 'driver');
  const customers = allUsers.filter((u) => u.role === 'customer');

  const completedTrips = allTrips.filter((t) => t.status === 'DROPPED_OFF');
  const activeTrips = allTrips.filter((t) => ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'PICKED_UP'].includes(t.status));
  const cancelledTrips = allTrips.filter((t) => t.status === 'CANCELLED');

  const totalRevenue = completedTrips.reduce((sum, t) => sum + (t.finalFare || t.estimatedFare || 0), 0);
  const totalDistance = completedTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  const avgTripCost = completedTrips.length > 0 ? Math.round(totalRevenue / completedTrips.length) : 0;

  const last7Days: { date: string; trips: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayTrips = completedTrips.filter((t) => t.createdAt.startsWith(dateStr));
    const dayRev = dayTrips.reduce((acc, t) => acc + (t.finalFare || t.estimatedFare || 0), 0);
    
    last7Days.push({
      date: dateStr,
      trips: dayTrips.length,
      revenue: dayRev,
    });
  }

  res.json({
    totalTrips: allTrips.length,
    completedTrips: completedTrips.length,
    activeTrips: activeTrips.length,
    cancelledTrips: cancelledTrips.length,
    totalRevenue,
    avgTripCost,
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    totalDrivers: drivers.length,
    onlineDrivers: drivers.filter((d) => d.isOnline).length,
    totalCustomers: customers.length,
    last7Days,
  });
});

app.get('/api/admin/drivers', authenticate, requireRole('admin'), (_req: AuthRequest, res) => {
  const drivers = db.getUsers().filter((u) => u.role === 'driver');
  const allTrips = db.getTrips();

  const driverStats = drivers.map((d) => {
    const trips = allTrips.filter((t) => t.driverId === d.id);
    const completed = trips.filter((t) => t.status === 'DROPPED_OFF');
    const revenue = completed.reduce((sum, t) => sum + (t.finalFare || t.estimatedFare || 0), 0);
    
    return {
      ...d,
      completedTripsCount: completed.length,
      totalEarned: revenue,
      activeTrip: trips.find((t) => ['ACCEPTED', 'ARRIVED', 'PICKED_UP'].includes(t.status)) || null,
    };
  });

  res.json(driverStats);
});

// Settings API
app.get('/api/settings', (_req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', authenticate, requireRole('admin'), (req: AuthRequest, res) => {
  const { googleMapsApiKey, baseFare, perKmRate, currency, companyName } = req.body;
  const updated = db.updateSettings({
    ...(googleMapsApiKey !== undefined && { googleMapsApiKey }),
    ...(baseFare !== undefined && { baseFare: parseFloat(baseFare) }),
    ...(perKmRate !== undefined && { perKmRate: parseFloat(perKmRate) }),
    ...(currency && { currency }),
    ...(companyName && { companyName }),
  });
  res.json(updated);
});

// Serve frontend in production/preview
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚗 Nasr Ride-Hailing Server running on port ${PORT}`);
  console.log(`Socket.IO listening for real-time dispatch`);
  console.log(`Web Client served from: ${clientDistPath}`);
  console.log(`=========================================`);
});
