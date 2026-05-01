import { io } from 'socket.io-client';

// In dev, Vite proxies /socket.io → localhost:5000
// In prod, use the explicit backend URL from env
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || '';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  path: '/socket.io',
});
