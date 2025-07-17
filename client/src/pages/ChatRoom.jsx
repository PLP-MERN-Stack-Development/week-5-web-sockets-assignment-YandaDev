import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import HeaderBar from '../components/HeaderBar';
import ChatMessage from '../components/ChatMessage';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import { cn } from '@/lib/utils';

const ChatRoom = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const { messages, typingUsers, loading } = useChat();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = (content) => {
    // Message sending is now handled directly in MessageInput component
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isAuthenticated) {
    return null; // or loading spinner
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out border-r bg-chat-sidebar',
          sidebarOpen ? 'w-80' : 'w-0',
          'lg:relative lg:w-80 lg:translate-x-0',
          !sidebarOpen && 'lg:w-0 lg:overflow-hidden'
        )}
      >
        <Sidebar className="h-full" />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <HeaderBar
          onToggleSidebar={toggleSidebar}
          showSidebarToggle={true}
        />

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-lg font-medium text-muted-foreground">Welcome to the chat!</p>
                    <p className="text-sm text-muted-foreground">Start a conversation by sending a message.</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const previousMessage = messages[index - 1];
                  const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId;
                  
                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      showAvatar={showAvatar}
                    />
                  );
                })
              )}
              
              {/* Typing Indicator */}
              <TypingIndicator users={typingUsers.map(u => u.username)} />
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <MessageInput
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default ChatRoom;