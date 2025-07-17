import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const UserItem = ({ user, isOnline, onClick }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
        'hover:bg-chat-sidebar-hover',
        onClick && 'hover:bg-accent'
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
          {user.username}
        </div>
        <div className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
};

export default UserItem;