import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const PrivateMessageContext = createContext();

const privateMessageReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
      };
    case 'ADD_CONVERSATION':
      if (state.conversations.find(conv => conv.recipientId === action.payload.recipientId)) {
        return state;
      }
      return {
        ...state,
        conversations: [...state.conversations, action.payload],
      };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.recipientId === action.payload.recipientId
            ? { ...conv, ...action.payload.updates }
            : conv
        ),
      };
    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversation: action.payload,
      };
    case 'ADD_PRIVATE_MESSAGE':
      const { conversationId, message } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), message],
        },
      };
    case 'SET_PRIVATE_MESSAGE_HISTORY':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      };
    case 'MARK_MESSAGES_READ':
      const { recipientId } = action.payload;
      const conversationKey = recipientId;
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationKey]: (state.messages[conversationKey] || []).map(msg => ({
            ...msg,
            isRead: msg.recipientId === state.currentUserId ? true : msg.isRead,
          })),
        },
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.conversationId]: action.payload.count,
        },
      };
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUserId: action.payload,
      };
    case 'CLEAR_UNREAD_COUNT':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.conversationId]: 0,
        },
      };
    default:
      return state;
  }
};

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  unreadCounts: {},
  currentUserId: null,
};

export const PrivateMessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(privateMessageReducer, initialState);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      dispatch({ type: 'SET_CURRENT_USER', payload: user.id });
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for incoming private messages
    socket.on('receive_private_message', (message) => {
      const conversationId = message.senderId;
      
      dispatch({ 
        type: 'ADD_PRIVATE_MESSAGE', 
        payload: { conversationId, message } 
      });

      // Add conversation if it doesn't exist
      dispatch({
        type: 'ADD_CONVERSATION',
        payload: {
          recipientId: message.senderId,
          recipientName: message.sender,
          recipientAvatar: message.senderAvatar,
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
        },
      });

      // Update unread count if not active conversation
      if (state.activeConversation !== conversationId) {
        const currentCount = state.unreadCounts[conversationId] || 0;
        dispatch({
          type: 'SET_UNREAD_COUNT',
          payload: { conversationId, count: currentCount + 1 },
        });
      }
    });

    // Listen for private message sent confirmation
    socket.on('private_message_sent', (message) => {
      const conversationId = message.recipientId;
      
      dispatch({ 
        type: 'ADD_PRIVATE_MESSAGE', 
        payload: { conversationId, message } 
      });

      // Update conversation
      dispatch({
        type: 'UPDATE_CONVERSATION',
        payload: {
          recipientId: conversationId,
          updates: {
            lastMessage: message.content,
            lastMessageTime: message.timestamp,
          },
        },
      });
    });

    // Listen for private message history
    socket.on('private_message_history', ({ recipientId, messages }) => {
      dispatch({
        type: 'SET_PRIVATE_MESSAGE_HISTORY',
        payload: { conversationId: recipientId, messages },
      });
    });

    // Listen for read receipts
    socket.on('private_messages_marked_read', ({ readBy }) => {
      dispatch({
        type: 'MARK_MESSAGES_READ',
        payload: { recipientId: readBy },
      });
    });

    return () => {
      socket.off('receive_private_message');
      socket.off('private_message_sent');
      socket.off('private_message_history');
      socket.off('private_messages_marked_read');
    };
  }, [socket, isConnected, state.activeConversation, state.unreadCounts]);

  const startConversation = (recipientId, recipientName, recipientAvatar) => {
    const conversation = {
      recipientId,
      recipientName,
      recipientAvatar,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: recipientId });

    // Get message history
    if (socket) {
      socket.emit('get_private_messages', { recipientId });
    }
  };

  const sendPrivateMessage = (recipientId, content) => {
    if (!socket || !content.trim()) return;

    socket.emit('send_private_message', {
      recipientId,
      content: content.trim(),
    });
  };

  const setActiveConversation = (recipientId) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: recipientId });
    
    // Clear unread count
    dispatch({
      type: 'CLEAR_UNREAD_COUNT',
      payload: { conversationId: recipientId },
    });

    // Mark messages as read
    if (socket) {
      socket.emit('mark_private_messages_read', { senderId: recipientId });
    }

    // Get message history if not loaded
    if (!state.messages[recipientId]) {
      socket.emit('get_private_messages', { recipientId });
    }
  };

  const closeConversation = () => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: null });
  };

  const value = {
    ...state,
    startConversation,
    sendPrivateMessage,
    setActiveConversation,
    closeConversation,
  };

  return (
    <PrivateMessageContext.Provider value={value}>
      {children}
    </PrivateMessageContext.Provider>
  );
};

export const usePrivateMessage = () => {
  const context = useContext(PrivateMessageContext);
  if (!context) {
    throw new Error('usePrivateMessage must be used within a PrivateMessageProvider');
  }
  return context;
};
