
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { connectSocket, disconnectSocket } from '../utils/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const token = localStorage.getItem('token');
      const socketInstance = connectSocket(token);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setConnected(false);
      });

      return () => {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, user?._id]);

  return { socket, connected };
};