import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from './db.js';
import { Trip, LocationCoords } from './types.js';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join rooms based on user auth info
    socket.on('user:join', (data: { userId: string; role: string }) => {
      socket.join(`user:${data.userId}`);
      if (data.role === 'driver') {
        socket.join('role:drivers');
      } else if (data.role === 'admin') {
        socket.join('role:admins');
      } else if (data.role === 'customer') {
        socket.join('role:customers');
      }
      console.log(`User ${data.userId} (${data.role}) joined socket rooms.`);
    });

    // Driver location ping
    socket.on('driver:location', (data: { driverId: string; coords: LocationCoords; tripId?: string }) => {
      db.updateUser(data.driverId, { currentLocation: data.coords });
      
      // If driver is on a trip, notify the customer
      if (data.tripId) {
        const trip = db.getTripById(data.tripId);
        if (trip && trip.customerId) {
          io.to(`user:${trip.customerId}`).emit('trip:driver_location', {
            tripId: data.tripId,
            driverId: data.driverId,
            coords: data.coords,
          });
        }
      }

      // Broadcast to admins
      io.to('role:admins').emit('admin:driver_location', {
        driverId: data.driverId,
        coords: data.coords,
      });
    });

    // Driver status toggle (Online / Offline)
    socket.on('driver:status', (data: { driverId: string; isOnline: boolean }) => {
      const updated = db.updateUser(data.driverId, { isOnline: data.isOnline });
      io.to('role:admins').emit('admin:driver_status_changed', {
        driverId: data.driverId,
        isOnline: data.isOnline,
        driver: updated,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
}

// Helper methods to emit real-time updates
export function notifyTripCreated(trip: Trip) {
  if (!ioInstance) return;
  // Broadcast to all drivers in queue
  ioInstance.to('role:drivers').emit('trip:new_request', trip);
  // Broadcast to admins
  ioInstance.to('role:admins').emit('trip:created', trip);
  // Notify customer
  ioInstance.to(`user:${trip.customerId}`).emit('trip:updated', trip);
}

export function notifyTripUpdated(trip: Trip) {
  if (!ioInstance) return;
  // Notify customer
  ioInstance.to(`user:${trip.customerId}`).emit('trip:updated', trip);
  
  // Notify driver if assigned
  if (trip.driverId) {
    ioInstance.to(`user:${trip.driverId}`).emit('trip:updated', trip);
  }

  // Broadcast to all drivers (so queue updates if trip is claimed or cancelled)
  ioInstance.to('role:drivers').emit('trip:queue_changed', trip);
  
  // Broadcast to admins
  ioInstance.to('role:admins').emit('trip:updated', trip);
}
