import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ROOMS':
      return {
        ...state,
        rooms: action.payload,
      };
    case 'SET_ACTIVE_ROOM':
      return {
        ...state,
        activeRoom: action.payload.roomId,
        currentRoomData: action.payload.room,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'ADD_MESSAGE':
      // Only add message if it's for the current active room
      if (action.payload.roomId === state.activeRoom || !action.payload.roomId) {
        return {
          ...state,
          messages: [...state.messages, action.payload],
        };
      }
      return state;
    case 'UPDATE_MESSAGE_REACTIONS':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, reactions: action.payload.reactions }
            : msg
        ),
      };
    case 'SET_MESSAGE_HISTORY':
      return {
        ...state,
        messages: action.payload,
        loading: false,
      };
    case 'SET_ROOM_USERS':
      return {
        ...state,
        users: action.payload,
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
  rooms: [],
  activeRoom: 'general',
  currentRoomData: null,
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

    // Socket event listeners for rooms
    socket.on('rooms_list', (rooms) => {
      dispatch({ type: 'SET_ROOMS', payload: rooms });
    });

    socket.on('room_joined', ({ roomId, room }) => {
      dispatch({ type: 'SET_ACTIVE_ROOM', payload: { roomId, room } });
    });

    socket.on('message_history', (messages) => {
      dispatch({ type: 'SET_MESSAGE_HISTORY', payload: messages });
    });

    socket.on('receive_message', (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
      // Auto-mark message as delivered if it's not from current user
      if (message.senderId !== user?.id && message.sender !== user?.username) {
        setTimeout(() => {
          markMessagesAsDelivered([message.id], message.roomId);
        }, 100);
      }
    });

    socket.on('room_users', (users) => {
      dispatch({ type: 'SET_ROOM_USERS', payload: users });
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

    socket.on('reaction_updated', ({ messageId, reactions }) => {
      dispatch({ 
        type: 'UPDATE_MESSAGE_REACTIONS', 
        payload: { messageId, reactions } 
      });
    });

    socket.on('message_read_receipt', (data) => {
      // Update read receipts in state if needed
      console.log('Message read receipt:', data);
    });

    socket.on('messages_delivered', (data) => {
      // Update delivery receipts in state if needed
      console.log('Messages delivered:', data);
    });

    socket.on('user_authenticated', (authenticatedUser) => {
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Cleanup function
    return () => {
      socket.off('rooms_list');
      socket.off('room_joined');
      socket.off('message_history');
      socket.off('receive_message');
      socket.off('room_users');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('typing_users');
      socket.off('reaction_updated');
      socket.off('message_read_receipt');
      socket.off('messages_delivered');
      socket.off('user_authenticated');
    };
  }, [socket, isConnected]);

  const joinRoom = (roomId) => {
    if (socket && roomId !== state.activeRoom) {
      socket.emit('join_room', roomId);
    }
  };

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

  const markMessageAsRead = (messageId, roomId) => {
    if (socket) {
      socket.emit('mark_message_read', { messageId, roomId });
    }
  };

  const markMessagesAsDelivered = (messageIds, roomId) => {
    if (socket && messageIds.length > 0) {
      socket.emit('mark_messages_delivered', { messageIds, roomId });
    }
  };

  // Calculate current room data
  const currentRoomData = state.rooms.find(room => room.id === state.activeRoom);

  const value = {
    ...state,
    currentRoomData,
    sendMessage,
    joinRoom,
    startTyping,
    stopTyping,
    clearNotifications,
    markMessageAsRead,
    markMessagesAsDelivered,
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