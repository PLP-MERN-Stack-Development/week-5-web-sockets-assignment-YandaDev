import { useEffect, useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext';

export const useTyping = (delay = 2000) => {
  const { startTyping, stopTyping } = useChat();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      startTyping();
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      isTypingRef.current = false;
    }, delay);
  }, [startTyping, stopTyping, delay]);

  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      stopTyping();
      isTypingRef.current = false;
    }
  }, [stopTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleTyping,
    handleStopTyping,
  };
};