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
  const { messages, sendMessage, typingUsers } = useChat();
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
    sendMessage(content);
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
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const previousMessage = messages[index - 1];
                  const showAvatar = !previousMessage || previousMessage.userId !== message.userId;
                  
                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      currentUserId={user?.id}
                      showAvatar={showAvatar}
                    />
                  );
                })
              )}
              
              {/* Typing Indicator */}
              <TypingIndicator users={typingUsers} />
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <MessageInput
            onSendMessage={handleSendMessage}
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