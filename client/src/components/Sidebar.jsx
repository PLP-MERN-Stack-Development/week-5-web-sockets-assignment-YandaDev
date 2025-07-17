import React from 'react';
import { Hash, Users, Settings, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { usePresence } from '../hooks/usePresence';
import RoomItem from './RoomItem';
import UserItem from './UserItem';
import { cn } from '@/lib/utils';

const Sidebar = ({ className }) => {
  const { user, logout } = useAuth();
  const { rooms, activeRoom, joinRoom, users } = useChat();
  const { onlineUsers } = usePresence();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={cn('flex flex-col bg-chat-sidebar border-r h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary">WolaChat</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
      </div>

      <ScrollArea className="flex-1">
        {/* Rooms Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Rooms
            </h2>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {rooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={activeRoom === room.id}
                onClick={() => joinRoom(room.id)}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Users Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Online ({onlineUsers.length})
            </h2>
          </div>
          
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                isOnline={true}
              />
            ))}
            
            {/* Show offline users from room */}
            {users
              .filter(user => !onlineUsers.some(ou => ou.id === user.id))
              .map((user) => (
                <UserItem
                  key={user.id}
                  user={user}
                  isOnline={false}
                />
              ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-medium">{user?.username}</div>
              <div className="text-muted-foreground text-xs">Online</div>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;