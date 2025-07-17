import React, { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTyping } from '../hooks/useTyping';
import { cn } from '@/lib/utils';

const MessageInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const { handleTyping, handleStopTyping } = useTyping();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSendMessage(message);
    setMessage('');
    handleStopTyping();
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (message.trim()) {
      handleTyping();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      handleStopTyping();
    }
  };

  const handleBlur = () => {
    handleStopTyping();
  };

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled}
            rows={1}
            className={cn(
              'min-h-[40px] max-h-[120px] resize-none rounded-xl border-border/50 focus:border-primary/50',
              'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 bottom-2 h-6 w-6 p-0"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || disabled}
          className="h-10 w-10 p-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;