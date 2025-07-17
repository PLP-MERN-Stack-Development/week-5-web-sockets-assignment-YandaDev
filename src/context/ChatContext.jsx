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
        activeRoom: action.payload,
        messages: state.roomMessages[action.payload] || [],
      };
    case 'ADD_MESSAGE':
      const { roomId, message } = action.payload;
      const updatedRoomMessages = {
        ...state.roomMessages,
        [roomId]: [...(state.roomMessages[roomId] || []), message],
      };
      
      return {
        ...state,
        roomMessages: updatedRoomMessages,
        messages: state.activeRoom === roomId ? updatedRoomMessages[roomId] : state.messages,
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'UPDATE_USER_STATUS':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.userId
            ? { ...user, status: action.payload.status }
            : user
        ),
      };
    case 'SET_TYPING_USERS':
      return {
        ...state,
        typingUsers: action.payload,
      };
    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: [...state.typingUsers.filter(u => u !== action.payload), action.payload],
      };
    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(u => u !== action.payload),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  rooms: [
    { id: 'general', name: 'General', description: 'General chat room' },
    { id: 'random', name: 'Random', description: 'Random discussions' },
  ],
  activeRoom: 'general',
  messages: [],
  roomMessages: {},
  users: [],
  typingUsers: [],
  loading: false,
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Socket event listeners
    socket.on('message:new', (message) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { roomId: message.roomId, message },
      });
    });

    socket.on('user:typing', ({ userId, username, roomId }) => {
      if (userId !== user?.id && roomId === state.activeRoom) {
        dispatch({ type: 'ADD_TYPING_USER', payload: username });
      }
    });

    socket.on('user:stoppedTyping', ({ userId, username, roomId }) => {
      if (userId !== user?.id && roomId === state.activeRoom) {
        dispatch({ type: 'REMOVE_TYPING_USER', payload: username });
      }
    });

    socket.on('room:users', (users) => {
      dispatch({ type: 'SET_USERS', payload: users });
    });

    socket.on('user:statusChanged', ({ userId, status }) => {
      dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId, status } });
    });

    // Join default room
    socket.emit('room:join', { roomId: state.activeRoom });

    return () => {
      socket.off('message:new');
      socket.off('user:typing');
      socket.off('user:stoppedTyping');
      socket.off('room:users');
      socket.off('user:statusChanged');
    };
  }, [socket, isConnected, user, state.activeRoom]);

  const sendMessage = (content) => {
    if (!socket || !content.trim()) return;

    const message = {
      id: Date.now().toString(),
      content: content.trim(),
      userId: user.id,
      username: user.username,
      roomId: state.activeRoom,
      timestamp: new Date().toISOString(),
    };

    // Optimistically add message
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { roomId: state.activeRoom, message },
    });

    // Emit to server
    socket.emit('message:send', message);
  };

  const joinRoom = (roomId) => {
    if (!socket || roomId === state.activeRoom) return;

    // Leave current room
    socket.emit('room:leave', { roomId: state.activeRoom });
    
    // Join new room
    socket.emit('room:join', { roomId });
    
    // Update state
    dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomId });
  };

  const startTyping = () => {
    if (socket) {
      socket.emit('user:typing', {
        roomId: state.activeRoom,
        userId: user.id,
        username: user.username,
      });
    }
  };

  const stopTyping = () => {
    if (socket) {
      socket.emit('user:stoppedTyping', {
        roomId: state.activeRoom,
        userId: user.id,
        username: user.username,
      });
    }
  };

  const value = {
    ...state,
    sendMessage,
    joinRoom,
    startTyping,
    stopTyping,
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