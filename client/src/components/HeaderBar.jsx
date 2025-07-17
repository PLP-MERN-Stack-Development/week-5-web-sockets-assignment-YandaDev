import React from 'react';
import { Hash, Users, Phone, Video, Info, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '../context/ChatContext';

const HeaderBar = ({ onToggleSidebar, showSidebarToggle = false }) => {
  const { users = [] } = useChat();
  
  // Mock room data for now
  const currentRoom = { name: 'General', description: 'Welcome to the general chat room' };
  const roomUserCount = users.length;
  const onlineCount = users.length;

  return (
    <div className="h-16 border-b bg-background px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{currentRoom?.name || 'Chat'}</h1>
        </div>
        
        {currentRoom?.description && (
          <div className="hidden md:block text-sm text-muted-foreground border-l pl-3">
            {currentRoom.description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{onlineCount} online</span>
        </div>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Phone className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Video className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HeaderBar;