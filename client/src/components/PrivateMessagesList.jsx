import React from 'react';
import { MessageCircle, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePrivateMessage } from '../context/PrivateMessageContext';

const PrivateMessagesList = ({ onOpenConversation }) => {
  const { conversations, unreadCounts } = usePrivateMessage();

  if (conversations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No private conversations yet</p>
        <p className="text-sm">Click on a user to start chatting</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {conversations.map((conversation) => {
          const unreadCount = unreadCounts[conversation.recipientId] || 0;
          
          return (
            <div
              key={conversation.recipientId}
              onClick={() => onOpenConversation(conversation)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.recipientAvatar} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{conversation.recipientName}</h4>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage || 'Start a conversation...'}
                </p>
                
                {conversation.lastMessageTime && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default PrivateMessagesList;
