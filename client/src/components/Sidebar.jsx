import React, { useState } from 'react';
import { Hash, Users, Settings, LogOut, Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-fixed';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { usePrivateMessage } from '../context/PrivateMessageContext';
import RoomItem from './RoomItem';
import UserItem from './UserItem';
import PrivateMessagesList from './PrivateMessagesList';
import PrivateMessageModal from './PrivateMessageModal';
import { cn } from '@/lib/utils';

const Sidebar = ({ className }) => {
  const { user, logout } = useAuth();
  const { rooms = [], activeRoom, joinRoom, users = [] } = useChat();
  const { startConversation } = usePrivateMessage();
  const [privateMessageModal, setPrivateMessageModal] = useState({
    isOpen: false,
    recipientId: null,
    recipientName: '',
    recipientAvatar: null,
  });

  const handleLogout = () => {
    logout();
  };

  const handlePrivateMessage = (recipient) => {
    startConversation(recipient.id, recipient.username, recipient.avatar);
    setPrivateMessageModal({
      isOpen: true,
      recipientId: recipient.id,
      recipientName: recipient.username,
      recipientAvatar: recipient.avatar,
    });
  };

  const handleOpenConversation = (conversation) => {
    setPrivateMessageModal({
      isOpen: true,
      recipientId: conversation.recipientId,
      recipientName: conversation.recipientName,
      recipientAvatar: conversation.recipientAvatar,
    });
  };

  const closePrivateMessageModal = () => {
    setPrivateMessageModal({
      isOpen: false,
      recipientId: null,
      recipientName: '',
      recipientAvatar: null,
    });
  };

  return (
    <div className={cn('flex flex-col bg-chat-sidebar border-r h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary">WolaChat</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
      </div>

      <Tabs defaultValue="rooms" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rooms" className="flex-1 mt-0">
          <ScrollArea className="h-full">
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
                {rooms?.map((room) => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    isActive={activeRoom === room.id}
                    onClick={() => joinRoom(room.id)}
                  />
                )) || (
                  <div className="text-sm text-muted-foreground">No rooms available</div>
                )}
              </div>
            </div>

            <Separator />

            {/* Users Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Online ({users?.length || 0})
                </h2>
              </div>
              
              <div className="space-y-1">
                {users?.map((chatUser) => (
                  <UserItem
                    key={chatUser.id}
                    user={chatUser}
                    isOnline={true}
                    currentUserId={user?.id}
                    onPrivateMessage={handlePrivateMessage}
                  />
                )) || (
                  <div className="text-sm text-muted-foreground">No users online</div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="messages" className="flex-1 mt-0">
          <PrivateMessagesList onOpenConversation={handleOpenConversation} />
        </TabsContent>
      </Tabs>

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

      {/* Private Message Modal */}
      <PrivateMessageModal
        isOpen={privateMessageModal.isOpen}
        onClose={closePrivateMessageModal}
        recipientId={privateMessageModal.recipientId}
        recipientName={privateMessageModal.recipientName}
        recipientAvatar={privateMessageModal.recipientAvatar}
      />
    </div>
  );
};

export default Sidebar;