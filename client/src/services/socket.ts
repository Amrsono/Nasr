import { io, Socket } from 'socket.io-client';
import { User } from '../types';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: false,
      timeout: 3000,
    });
  }
  return socket;
}

export function joinSocketUser(user: User) {
  try {
    const s = getSocket();
    if (!s.connected) {
      s.connect();
    }
    s.emit('user:join', { userId: user.id, role: user.role });
  } catch {}
}

export function sendDriverLocation(driverId: string, coords: { lat: number; lng: number }, tripId?: string) {
  try {
    const s = getSocket();
    if (s.connected) {
      s.emit('driver:location', { driverId, coords, tripId });
    }
  } catch {}
}

export function sendDriverStatus(driverId: string, isOnline: boolean) {
  try {
    const s = getSocket();
    if (s.connected) {
      s.emit('driver:status', { driverId, isOnline });
    }
  } catch {}
}
