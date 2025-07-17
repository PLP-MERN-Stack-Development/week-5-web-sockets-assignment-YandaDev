import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';

const ChatMessage = ({ message, showAvatar = true }) => {
  const { user } = useAuth();
  const isOwn = message.senderId === user?.id || message.sender === user?.username;
  const timestamp = new Date(message.timestamp);

  const formatTimestamp = (date) => {
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy HH:mm');
    }
  };

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 max-w-[80%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback className="text-xs">
            {message.sender?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && (
          <div className="text-sm font-medium text-muted-foreground mb-1">
            {message.sender}
          </div>
        )}
        
        <div
          className={cn(
            'px-4 py-2 rounded-2xl shadow-sm max-w-full break-words',
            isOwn
              ? 'bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-md'
              : 'bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-md'
          )}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1 px-2">
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;