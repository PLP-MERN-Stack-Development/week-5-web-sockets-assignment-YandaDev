import React, { useState } from 'react';
import { Smile, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉', '👏',
  '🙏', '💯', '🤔', '😊', '😍', '🤯', '💪', '✨', '⭐', '🎯'
];

const MessageReactions = ({ message, onAddReaction }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useAuth();
  const { activeRoom } = useChat();

  const handleEmojiClick = (emoji) => {
    onAddReaction(message.id, emoji, message.roomId || activeRoom);
    setShowEmojiPicker(false);
  };

  const getReactionCounts = () => {
    if (!message.reactions || message.reactions.length === 0) return {};
    
    const counts = {};
    message.reactions.forEach(reaction => {
      if (counts[reaction.emoji]) {
        counts[reaction.emoji].count++;
        counts[reaction.emoji].users.push(reaction.username);
        if (reaction.userId === user?.id) {
          counts[reaction.emoji].userReacted = true;
        }
      } else {
        counts[reaction.emoji] = {
          count: 1,
          users: [reaction.username],
          userReacted: reaction.userId === user?.id
        };
      }
    });
    
    return counts;
  };

  const reactionCounts = getReactionCounts();
  const hasReactions = Object.keys(reactionCounts).length > 0;

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {/* Existing reactions */}
      {hasReactions && Object.entries(reactionCounts).map(([emoji, data]) => (
        <Button
          key={emoji}
          variant={data.userReacted ? "secondary" : "ghost"}
          size="sm"
          className={`h-6 px-2 text-xs gap-1 ${
            data.userReacted 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300' 
              : 'hover:bg-accent'
          }`}
          onClick={() => handleEmojiClick(emoji)}
          title={`${data.users.join(', ')} reacted with ${emoji}`}
        >
          <span>{emoji}</span>
          <span className="text-xs">{data.count}</span>
        </Button>
      ))}

      {/* Add reaction button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add reaction"
          >
            {showEmojiPicker ? <Smile className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="grid grid-cols-5 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;
