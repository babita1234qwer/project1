
import { io } from 'socket.io-client';

const API_URI = import.meta.env.VITE_API_URI;

let socket;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URI, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('connect_error', (err) => console.error('Socket connect error:', err));

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('Socket not connected. Call connectSocket first.');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
