import React from 'react';
import { Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RoomItem = ({ room, isActive, onClick }) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        'w-full justify-start gap-2 h-9 px-3 rounded-lg text-left',
        isActive
          ? 'bg-primary/10 text-primary hover:bg-primary/15'
          : 'hover:bg-chat-sidebar-hover text-muted-foreground hover:text-foreground'
      )}
    >
      <Hash className="h-4 w-4 shrink-0" />
      <span className="truncate">{room.name}</span>
    </Button>
  );
};

export default RoomItem;