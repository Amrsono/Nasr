import { io, Socket } from 'socket.io-client';
import { User } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function joinSocketUser(user: User) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  s.emit('user:join', { userId: user.id, role: user.role });
}

export function sendDriverLocation(driverId: string, coords: { lat: number; lng: number }, tripId?: string) {
  const s = getSocket();
  s.emit('driver:location', { driverId, coords, tripId });
}

export function sendDriverStatus(driverId: string, isOnline: boolean) {
  const s = getSocket();
  s.emit('driver:status', { driverId, isOnline });
}
