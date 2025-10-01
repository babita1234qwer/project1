// services/socket.js
import io from 'socket.io-client';

const socket = io( 'http://localhost:5173');

export const connectSocket = (userId) => {
  socket.emit('authenticate', userId);
  socket.emit('join', `user:${userId}`);
  
  return socket;
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;