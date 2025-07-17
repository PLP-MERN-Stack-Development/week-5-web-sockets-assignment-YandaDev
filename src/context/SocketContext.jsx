import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../socket/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket with user authentication
      const socketInstance = socketService.connect('http://localhost:3001', {
        userId: user.id,
        username: user.username,
      });

      setSocket(socketInstance);

      // Listen for connection status
      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      return () => {
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect if user is not authenticated
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
    emit: socketService.emit.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};