import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_MESSAGE_HISTORY':
      return {
        ...state,
        messages: action.payload,
        loading: false,
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'USER_JOINED':
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          type: 'user_joined',
          message: `${action.payload.username} joined the chat`,
          timestamp: new Date().toISOString(),
        }],
      };
    case 'USER_LEFT':
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          type: 'user_left',
          message: `${action.payload.username} left the chat`,
          timestamp: new Date().toISOString(),
        }],
      };
    case 'SET_TYPING_USERS':
      return {
        ...state,
        typingUsers: action.payload.filter(user => user.username !== state.currentUser?.username),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
};

const initialState = {
  messages: [],
  users: [],
  typingUsers: [],
  notifications: [],
  currentUser: null,
  loading: true,
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });

    // Socket event listeners
    socket.on('message_history', (messages) => {
      dispatch({ type: 'SET_MESSAGE_HISTORY', payload: messages });
    });

    socket.on('receive_message', (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('user_list', (users) => {
      dispatch({ type: 'SET_USERS', payload: users });
    });

    socket.on('user_joined', (userData) => {
      dispatch({ type: 'USER_JOINED', payload: userData });
    });

    socket.on('user_left', (userData) => {
      dispatch({ type: 'USER_LEFT', payload: userData });
    });

    socket.on('typing_users', (typingUsers) => {
      dispatch({ type: 'SET_TYPING_USERS', payload: typingUsers });
    });

    socket.on('user_authenticated', (authenticatedUser) => {
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Cleanup function
    return () => {
      socket.off('message_history');
      socket.off('receive_message');
      socket.off('user_list');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('typing_users');
      socket.off('user_authenticated');
    };
  }, [socket, isConnected]);

  const sendMessage = (content) => {
    if (!socket || !content.trim()) return;

    const messageData = {
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    // Emit to server
    socket.emit('send_message', messageData);
  };

  const startTyping = () => {
    if (socket) {
      socket.emit('typing', true);
    }
  };

  const stopTyping = () => {
    if (socket) {
      socket.emit('typing', false);
    }
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const value = {
    ...state,
    sendMessage,
    startTyping,
    stopTyping,
    clearNotifications,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};