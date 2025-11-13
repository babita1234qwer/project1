// utils/socket.js
import { io } from 'socket.io-client';



let socket;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io( 'http://localhost:3001', {
    auth: {
      token
    }
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not connected. Call connectSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};