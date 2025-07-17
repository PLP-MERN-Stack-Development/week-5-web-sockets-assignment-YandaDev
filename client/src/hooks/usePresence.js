import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export const usePresence = () => {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user:connected', (user) => {
      setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socket.on('user:disconnected', (userId) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
    });

    // Request current online users
    socket.emit('users:getOnline');

    return () => {
      socket.off('users:online');
      socket.off('user:connected');
      socket.off('user:disconnected');
    };
  }, [socket, isConnected]);

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.id === userId);
  };

  return {
    onlineUsers,
    isUserOnline,
  };
};