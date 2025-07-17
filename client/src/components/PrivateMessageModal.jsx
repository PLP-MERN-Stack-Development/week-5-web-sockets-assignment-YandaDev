import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePrivateMessage } from '../context/PrivateMessageContext';

const PrivateMessageModal = ({ isOpen, onClose, recipientId, recipientName, recipientAvatar }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { 
    messages, 
    activeConversation, 
    sendPrivateMessage, 
    setActiveConversation 
  } = usePrivateMessage();

  const conversationMessages = messages[recipientId] || [];

  useEffect(() => {
    if (isOpen && recipientId) {
      setActiveConversation(recipientId);
    }
  }, [isOpen, recipientId, setActiveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && recipientId) {
      sendPrivateMessage(recipientId, message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-96 h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{recipientName}</h3>
              <p className="text-sm text-muted-foreground">Private Message</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {conversationMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Start a conversation with {recipientName}</p>
              </div>
            ) : (
              conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === recipientId ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      msg.senderId === recipientId
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {msg.senderId !== recipientId && msg.isRead && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${recipientName}...`}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrivateMessageModal;
