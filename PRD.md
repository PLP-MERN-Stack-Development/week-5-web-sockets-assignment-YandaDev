## 🚀 Objective
Build a real-time chat application using Socket.io that demonstrates bidirectional communication between clients and server, implementing features like live messaging, notifications, and online status updates.

## 🧪 Expected Outcome
You will build a chat application with the following features:
- A fully functional real-time chat application
- Smooth bidirectional communication using Socket.io
- Good user experience with proper error handling and loading states
- Implementation of at least 3 advanced chat features
- Responsive design that works on different devices
1. Real-time messaging using Socket.io
2. User authentication and presence
3. Multiple chat rooms or private messaging
4. Real-time notifications
5. Advanced features like typing indicators and read receipts



## 📂 Tasks

### Task 1: Project Setup
- Set up a Node.js server with Express
- Configure Socket.io on the server side
- Create a React front-end application
- Set up Socket.io client in the React app
- Establish a basic connection between client and server

### Task 2: Core Chat Functionality
- Implement user authentication (simple username-based or JWT)
- Create a global chat room where all users can send and receive messages
- Display messages with sender's name and timestamp
- Show typing indicators when a user is composing a message
- Implement online/offline status for users

### Task 3: Advanced Chat Features
- Create private messaging between users
- Implement multiple chat rooms or channels
- Add "user is typing" indicator
- Enable file or image sharing
- Implement read receipts for messages
- Add message reactions (like, love, etc.)

### Task 4: Real-Time Notifications
- Send notifications when a user receives a new message
- Notify when a user joins or leaves a chat room
- Display unread message count
- Implement sound notifications for new messages
- Add browser notifications (using the Web Notifications API)

### Task 5: Performance and UX Optimization
- Implement message pagination for loading older messages
- Add reconnection logic for handling disconnections
- Optimize Socket.io for performance (using namespaces, rooms)
- Implement message delivery acknowledgment
- Add message search functionality
- Ensure the application works well on both desktop and mobile devices
