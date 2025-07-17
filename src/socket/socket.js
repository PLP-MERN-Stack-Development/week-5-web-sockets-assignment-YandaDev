import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(serverUrl = 'http://localhost:3001', auth = null) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(serverUrl, {
      auth,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data, callback) {
    if (this.socket) {
      this.socket.emit(event, data, callback);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from listeners
      if (this.listeners.has(event)) {
        const eventListeners = this.listeners.get(event);
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getId() {
    return this.socket?.id;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;