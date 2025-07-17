import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Eye, Check, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const MessageReceipts = ({ messageId, currentUserId }) => {
  const { socket } = useSocket();
  const [receipts, setReceipts] = useState({ readReceipts: [], deliveryReceipts: [] });
  const [showReceipts, setShowReceipts] = useState(false);

  useEffect(() => {
    if (socket && messageId) {
      // Get initial receipt data
      socket.emit('get_message_receipts', messageId, (data) => {
        setReceipts(data);
      });

      // Listen for new read receipts
      const handleReadReceipt = (data) => {
        if (data.messageId === messageId) {
          setReceipts(prev => ({
            ...prev,
            readReceipts: [...prev.readReceipts, {
              userId: data.readBy.userId,
              username: data.readBy.username,
              readAt: data.readAt
            }]
          }));
        }
      };

      // Listen for delivery receipts
      const handleDeliveryReceipt = (data) => {
        if (data.messageIds.includes(messageId)) {
          setReceipts(prev => ({
            ...prev,
            deliveryReceipts: [...prev.deliveryReceipts, {
              userId: data.deliveredTo.userId,
              username: data.deliveredTo.username,
              deliveredAt: data.deliveredAt
            }]
          }));
        }
      };

      socket.on('message_read_receipt', handleReadReceipt);
      socket.on('messages_delivered', handleDeliveryReceipt);

      return () => {
        socket.off('message_read_receipt', handleReadReceipt);
        socket.off('messages_delivered', handleDeliveryReceipt);
      };
    }
  }, [socket, messageId]);

  const { readReceipts, deliveryReceipts } = receipts;
  
  // Don't show receipts for messages from current user to themselves
  const otherUsersRead = readReceipts.filter(r => r.userId !== currentUserId);
  const otherUsersDelivered = deliveryReceipts.filter(d => d.userId !== currentUserId);

  // Determine status icon
  const getStatusIcon = () => {
    if (otherUsersRead.length > 0) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (otherUsersDelivered.length > 0) {
      return <Check className="w-4 h-4 text-gray-500" />;
    }
    return <Check className="w-4 h-4 text-gray-300" />;
  };

  // Don't render if no receipts and message is from current user
  if (otherUsersRead.length === 0 && otherUsersDelivered.length === 0) {
    return getStatusIcon();
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
          onClick={() => setShowReceipts(!showReceipts)}
        >
          {getStatusIcon()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          {otherUsersRead.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Eye className="w-4 h-4 mr-1 text-blue-500" />
                Read by {otherUsersRead.length}
              </h4>
              <div className="space-y-1">
                {otherUsersRead.map((receipt, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="font-medium">{receipt.username}</span>
                    <span className="text-gray-500">
                      {new Date(receipt.readAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherUsersDelivered.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Check className="w-4 h-4 mr-1 text-gray-500" />
                Delivered to {otherUsersDelivered.length}
              </h4>
              <div className="space-y-1">
                {otherUsersDelivered.map((receipt, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="font-medium">{receipt.username}</span>
                    <span className="text-gray-500">
                      {new Date(receipt.deliveredAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MessageReceipts;
