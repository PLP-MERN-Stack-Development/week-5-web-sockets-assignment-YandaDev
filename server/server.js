// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter to restrict file types (optional - for security)
const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Store connected users, messages by room, and typing users
const users = {};
const roomMessages = {
  'general': [],
  'random': [],
  'tech': [],
  'gaming': []
};
const privateMessages = {}; // Store private messages between users
const typingUsers = {};
const userRooms = {}; // Track which room each user is in
const messageReadReceipts = {}; // Track read receipts for messages
const messageDeliveryReceipts = {}; // Track delivery receipts for messages

// Default rooms configuration
const defaultRooms = [
  { id: 'general', name: 'General', description: 'General discussion for everyone' },
  { id: 'random', name: 'Random', description: 'Random chat and fun conversations' },
  { id: 'tech', name: 'Tech Talk', description: 'Technology and programming discussions' },
  { id: 'gaming', name: 'Gaming', description: 'Gaming discussions and reviews' }
];

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      url: `/uploads/${req.file.filename}`
    };

    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user authentication and joining
  socket.on('user_join', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username || userData,
      email: userData.email || null,
      avatar: userData.avatar || null,
      status: 'online',
      joinedAt: new Date().toISOString(),
      currentRoom: 'general' // Default room
    };
    
    users[socket.id] = user;
    userRooms[socket.id] = 'general'; // Set default room
    
    // Join the default room
    socket.join('general');
    
    // Send welcome message to user
    socket.emit('user_authenticated', user);
    
    // Send available rooms
    socket.emit('rooms_list', defaultRooms);
    
    // Send existing messages from the general room
    socket.emit('message_history', roomMessages['general'] || []);
    
    // Send current room info
    socket.emit('room_joined', { 
      roomId: 'general', 
      room: defaultRooms.find(r => r.id === 'general') 
    });
    
    // Notify all users in the room about the new user
    socket.to('general').emit('user_joined', { username: user.username, id: socket.id });
    
    // Send user list for the current room
    const roomUsers = Object.values(users).filter(u => userRooms[u.id] === 'general');
    io.to('general').emit('room_users', roomUsers);
    
    console.log(`${user.username} joined the chat`);
  });

  // Handle room joining
  socket.on('join_room', (roomId) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const room = defaultRooms.find(r => r.id === roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const currentRoom = userRooms[socket.id];
    
    // Leave current room
    if (currentRoom) {
      socket.leave(currentRoom);
      socket.to(currentRoom).emit('user_left', { 
        username: user.username, 
        id: socket.id 
      });
      
      // Update room users list for old room
      const oldRoomUsers = Object.values(users).filter(u => userRooms[u.id] === currentRoom);
      io.to(currentRoom).emit('room_users', oldRoomUsers);
    }
    
    // Join new room
    socket.join(roomId);
    userRooms[socket.id] = roomId;
    user.currentRoom = roomId;
    
    // Send room data to user
    socket.emit('room_joined', { roomId, room });
    socket.emit('message_history', roomMessages[roomId] || []);
    
    // Notify room users
    socket.to(roomId).emit('user_joined', { 
      username: user.username, 
      id: socket.id 
    });
    
    // Update room users list
    const newRoomUsers = Object.values(users).filter(u => userRooms[u.id] === roomId);
    io.to(roomId).emit('room_users', newRoomUsers);
    
    console.log(`${user.username} joined room: ${room.name}`);
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
    const roomId = userRooms[socket.id] || 'general';
    
    const message = {
      id: `msg_${Date.now()}_${socket.id}`,
      content: messageData.content || messageData.message || messageData,
      sender: user.username,
      senderId: socket.id,
      senderEmail: user.email,
      senderAvatar: user.avatar,
      timestamp: new Date().toISOString(),
      type: 'text',
      isEdited: false,
      roomId: roomId
    };
    
    // Store message in the appropriate room
    if (!roomMessages[roomId]) {
      roomMessages[roomId] = [];
    }
    roomMessages[roomId].push(message);
    
    // Limit stored messages to prevent memory issues (keep last 100 per room)
    if (roomMessages[roomId].length > 100) {
      roomMessages[roomId].shift();
    }
    
    // Broadcast message to users in the same room only
    io.to(roomId).emit('receive_message', message);
    
    console.log(`Message from ${user.username} in ${roomId}: ${message.content}`);
  });

  // Handle file messages
  socket.on('send_file_message', (fileData) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
    const roomId = userRooms[socket.id] || 'general';
    
    const message = {
      id: `msg_${Date.now()}_${socket.id}`,
      content: fileData.caption || '',
      sender: user.username,
      senderId: socket.id,
      senderEmail: user.email,
      senderAvatar: user.avatar,
      timestamp: new Date().toISOString(),
      type: 'file',
      isEdited: false,
      roomId: roomId,
      file: {
        id: fileData.file.id,
        originalName: fileData.file.originalName,
        filename: fileData.file.filename,
        size: fileData.file.size,
        mimetype: fileData.file.mimetype,
        url: fileData.file.url,
        uploadedAt: fileData.file.uploadedAt
      }
    };
    
    // Store message in the appropriate room
    if (!roomMessages[roomId]) {
      roomMessages[roomId] = [];
    }
    roomMessages[roomId].push(message);
    
    // Limit stored messages to prevent memory issues (keep last 100 per room)
    if (roomMessages[roomId].length > 100) {
      roomMessages[roomId].shift();
    }
    
    // Broadcast file message to users in the same room only
    io.to(roomId).emit('receive_message', message);
    
    console.log(`File from ${user.username} in ${roomId}: ${fileData.file.originalName} (${fileData.file.size} bytes)`);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const user = users[socket.id];
    if (!user) return;
    
    const roomId = userRooms[socket.id] || 'general';
    
    if (isTyping) {
      typingUsers[socket.id] = {
        username: user.username,
        id: socket.id,
        startedTyping: new Date().toISOString(),
        roomId: roomId
      };
    } else {
      delete typingUsers[socket.id];
    }
    
    // Send typing status to other users in the same room only
    const roomTypingUsers = Object.values(typingUsers).filter(tu => tu.roomId === roomId);
    socket.to(roomId).emit('typing_users', roomTypingUsers);
  });
  
  // Handle user status updates (online/away/busy)
  socket.on('update_status', (status) => {
    const user = users[socket.id];
    if (user) {
      user.status = status;
      user.lastSeen = new Date().toISOString();
      io.emit('user_list', Object.values(users));
    }
  });

  // Handle private messages
  socket.on('send_private_message', ({ recipientId, content }) => {
    const sender = users[socket.id];
    if (!sender) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const recipient = users[recipientId];
    if (!recipient) {
      socket.emit('error', { message: 'Recipient not found' });
      return;
    }

    const messageData = {
      id: `pm_${Date.now()}_${socket.id}`,
      content: content,
      sender: sender.username,
      senderId: socket.id,
      senderAvatar: sender.avatar,
      recipient: recipient.username,
      recipientId: recipientId,
      timestamp: new Date().toISOString(),
      type: 'private',
      isRead: false
    };

    // Create conversation key (sorted IDs for consistency)
    const conversationKey = [socket.id, recipientId].sort().join('_');
    
    // Store private message
    if (!privateMessages[conversationKey]) {
      privateMessages[conversationKey] = [];
    }
    privateMessages[conversationKey].push(messageData);

    // Limit stored messages (keep last 50 per conversation)
    if (privateMessages[conversationKey].length > 50) {
      privateMessages[conversationKey].shift();
    }

    // Send to recipient
    socket.to(recipientId).emit('receive_private_message', messageData);
    
    // Send confirmation back to sender
    socket.emit('private_message_sent', messageData);

    console.log(`Private message from ${sender.username} to ${recipient.username}: ${content}`);
  });

  // Handle getting private message history
  socket.on('get_private_messages', ({ recipientId }) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const conversationKey = [socket.id, recipientId].sort().join('_');
    const messages = privateMessages[conversationKey] || [];
    
    socket.emit('private_message_history', {
      recipientId,
      messages
    });
  });

  // Handle marking private messages as read
  socket.on('mark_private_messages_read', ({ senderId }) => {
    const conversationKey = [socket.id, senderId].sort().join('_');
    const messages = privateMessages[conversationKey] || [];
    
    // Mark messages as read
    messages.forEach(msg => {
      if (msg.recipientId === socket.id) {
        msg.isRead = true;
      }
    });

    // Notify sender that messages have been read
    socket.to(senderId).emit('private_messages_marked_read', {
      readBy: socket.id,
      conversationKey
    });
  });

  // Handle message reactions
  socket.on('add_reaction', ({ messageId, emoji, roomId }) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const currentRoomId = roomId || userRooms[socket.id] || 'general';
    const messages = roomMessages[currentRoomId] || [];
    const message = messages.find(msg => msg.id === messageId);

    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }

    // Initialize reactions array if it doesn't exist
    if (!message.reactions) {
      message.reactions = [];
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      reaction => reaction.emoji === emoji && reaction.userId === socket.id
    );

    if (existingReaction) {
      // Remove existing reaction
      message.reactions = message.reactions.filter(
        reaction => !(reaction.emoji === emoji && reaction.userId === socket.id)
      );
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        userId: socket.id,
        username: user.username,
        timestamp: new Date().toISOString()
      });
    }

    // Broadcast reaction update to all users in the room
    io.to(currentRoomId).emit('reaction_updated', {
      messageId,
      reactions: message.reactions
    });

    console.log(`${user.username} ${existingReaction ? 'removed' : 'added'} reaction ${emoji} to message ${messageId}`);
  });

  // Handle removing all reactions from a message
  socket.on('remove_reaction', ({ messageId, emoji, roomId }) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const currentRoomId = roomId || userRooms[socket.id] || 'general';
    const messages = roomMessages[currentRoomId] || [];
    const message = messages.find(msg => msg.id === messageId);

    if (!message || !message.reactions) {
      socket.emit('error', { message: 'Message or reaction not found' });
      return;
    }

    // Remove specific user's reaction
    message.reactions = message.reactions.filter(
      reaction => !(reaction.emoji === emoji && reaction.userId === socket.id)
    );

    // Broadcast reaction update to all users in the room
    io.to(currentRoomId).emit('reaction_updated', {
      messageId,
      reactions: message.reactions
    });

    console.log(`${user.username} removed reaction ${emoji} from message ${messageId}`);
  });

  // Enhanced Read Receipts
  socket.on('mark_message_read', (data) => {
    console.log('Message marked as read:', data);
    const { messageId, roomId } = data;
    const user = users[socket.id];
    
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
    const currentRoomId = roomId || userRooms[socket.id] || 'general';
    
    // Store read receipt
    if (!messageReadReceipts[messageId]) {
      messageReadReceipts[messageId] = [];
    }
    
    // Check if user already marked this message as read
    const existingReceipt = messageReadReceipts[messageId].find(r => r.userId === socket.id);
    if (!existingReceipt) {
      messageReadReceipts[messageId].push({
        userId: socket.id,
        username: user.username,
        readAt: new Date().toISOString()
      });
      
      // Broadcast read receipt to the room (excluding the reader)
      socket.to(currentRoomId).emit('message_read_receipt', {
        messageId,
        readBy: {
          userId: socket.id,
          username: user.username
        },
        readAt: new Date().toISOString()
      });
    }
  });

  socket.on('mark_messages_delivered', (data) => {
    console.log('Messages marked as delivered:', data);
    const { messageIds, roomId } = data;
    const user = users[socket.id];
    
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
    const currentRoomId = roomId || userRooms[socket.id] || 'general';
    
    messageIds.forEach(messageId => {
      if (!messageDeliveryReceipts[messageId]) {
        messageDeliveryReceipts[messageId] = [];
      }
      
      // Check if user already marked this message as delivered
      const existingReceipt = messageDeliveryReceipts[messageId].find(d => d.userId === socket.id);
      if (!existingReceipt) {
        messageDeliveryReceipts[messageId].push({
          userId: socket.id,
          username: user.username,
          deliveredAt: new Date().toISOString()
        });
      }
    });
    
    // Broadcast delivery receipt to the room (excluding the receiver)
    socket.to(currentRoomId).emit('messages_delivered', {
      messageIds,
      deliveredTo: {
        userId: socket.id,
        username: user.username
      },
      deliveredAt: new Date().toISOString()
    });
  });

  socket.on('get_message_receipts', (messageId, callback) => {
    const readReceipts = messageReadReceipts[messageId] || [];
    const deliveryReceipts = messageDeliveryReceipts[messageId] || [];
    
    if (callback) {
      callback({
        messageId,
        readReceipts,
        deliveryReceipts
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    const roomId = userRooms[socket.id];
    
    if (user && roomId) {
      console.log(`${user.username} left the chat from room: ${roomId}`);
      
      // Notify other users in the same room
      socket.to(roomId).emit('user_left', { 
        username: user.username, 
        id: socket.id,
        leftAt: new Date().toISOString()
      });
      
      // Update room users list
      const roomUsers = Object.values(users).filter(u => userRooms[u.id] === roomId && u.id !== socket.id);
      socket.to(roomId).emit('room_users', roomUsers);
    }
    
    // Clean up user data
    delete users[socket.id];
    delete typingUsers[socket.id];
    delete userRooms[socket.id];
    
    // Update typing users for all rooms
    const remainingTypingUsers = Object.values(typingUsers);
    if (roomId) {
      const roomTypingUsers = remainingTypingUsers.filter(tu => tu.roomId === roomId);
      io.to(roomId).emit('typing_users', roomTypingUsers);
    }
  });
});

// API routes
app.get('/api/rooms', (req, res) => {
  res.json(defaultRooms);
});

app.get('/api/messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(roomMessages[roomId] || []);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/api/users/:roomId', (req, res) => {
  const { roomId } = req.params;
  const roomUsers = Object.values(users).filter(u => userRooms[u.id] === roomId);
  res.json(roomUsers);
});

app.get('/api/private-messages/:userId1/:userId2', (req, res) => {
  const { userId1, userId2 } = req.params;
  const conversationKey = [userId1, userId2].sort().join('_');
  res.json(privateMessages[conversationKey] || []);
});

// File download route
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Send file for download
  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).json({ error: 'Download failed' });
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 