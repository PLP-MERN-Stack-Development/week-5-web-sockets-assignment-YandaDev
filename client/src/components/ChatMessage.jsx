import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const ChatMessage = ({ message, currentUserId, showAvatar = true }) => {
  const isOwn = message.userId === currentUserId;
  const timestamp = new Date(message.timestamp);

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 max-w-[80%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={message.avatar} />
          <AvatarFallback className="text-xs">
            {message.username?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && (
          <div className="text-sm font-medium text-muted-foreground mb-1">
            {message.username}
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
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;