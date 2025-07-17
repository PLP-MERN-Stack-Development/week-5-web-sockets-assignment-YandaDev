// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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

// Store connected users and messages
const users = {};
const messages = [];
const typingUsers = {};

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
    };
    
    users[socket.id] = user;
    
    // Send welcome message to user
    socket.emit('user_authenticated', user);
    
    // Send existing messages to newly joined user
    socket.emit('message_history', messages);
    
    // Notify all users about the new user
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username: user.username, id: socket.id });
    
    console.log(`${user.username} joined the chat`);
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
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
    };
    
    messages.push(message);
    
    // Limit stored messages to prevent memory issues (keep last 100)
    if (messages.length > 100) {
      messages.shift();
    }
    
    // Broadcast message to all connected users
    io.emit('receive_message', message);
    
    console.log(`Message from ${user.username}: ${message.content}`);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const user = users[socket.id];
    if (!user) return;
    
    if (isTyping) {
      typingUsers[socket.id] = {
        username: user.username,
        id: socket.id,
        startedTyping: new Date().toISOString(),
      };
    } else {
      delete typingUsers[socket.id];
    }
    
    // Send typing status to all other users (not the sender)
    socket.broadcast.emit('typing_users', Object.values(typingUsers));
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
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      console.log(`${user.username} left the chat`);
      
      // Notify other users
      socket.broadcast.emit('user_left', { 
        username: user.username, 
        id: socket.id,
        leftAt: new Date().toISOString()
      });
    }
    
    // Clean up user data
    delete users[socket.id];
    delete typingUsers[socket.id];
    
    // Update user lists for remaining users
    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// API routes
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
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