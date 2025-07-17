import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const UserItem = ({ user, isOnline, onClick, onPrivateMessage, currentUserId }) => {
  const isCurrentUser = user.id === currentUserId;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        'hover:bg-chat-sidebar-hover group',
        onClick && 'cursor-pointer hover:bg-accent'
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="w-7 h-7">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-xs">
            {user.username?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
            isOnline ? 'bg-chat-online-status' : 'bg-chat-offline-status'
          )}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {user.username} {isCurrentUser && '(You)'}
        </div>
        <div className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {!isCurrentUser && onPrivateMessage && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onPrivateMessage(user);
          }}
          title={`Send private message to ${user.username}`}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default UserItem;