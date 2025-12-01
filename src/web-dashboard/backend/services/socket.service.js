// services/socket.service.js
/**
 * Socket.io Service for Real-Time Notifications
 * Handles real-time communication between citizens and responders
 */

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map of citizenId -> socketId
  }

  /**
   * Initialize Socket.io server
   */
  initialize(server) {
    const socketio = require('socket.io');
    
    this.io = socketio(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'https://resq-five.vercel.app',
          'https://resq.vercel.app',
          process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`[SOCKET] New connection: ${socket.id}`);

      // Handle SOS room join
      socket.on('join-sos-room', (data) => {
        const { sosId, citizenId } = data;
        
        if (sosId) {
          const roomName = `sos_${sosId}`;
          socket.join(roomName);
          
          if (citizenId) {
            this.connectedUsers.set(citizenId, socket.id);
          }
          
          console.log(`[SOCKET] User joined SOS room: ${roomName}`);
          
          // Send confirmation
          socket.emit('room-joined', {
            room: roomName,
            message: 'Connected to real-time updates'
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
        
        // Remove from connected users
        for (const [citizenId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(citizenId);
            break;
          }
        }
      });
    });

    console.log('[SOCKET] Socket.io initialized');
  }

  /**
   * Notify citizen about responder updates
   */
  notifyResponderUpdate(sosId, updateData) {
    if (!this.io) {
      console.warn('[SOCKET] Socket.io not initialized');
      return;
    }

    const roomName = `sos_${sosId}`;
    
    this.io.to(roomName).emit('responder-update', {
      type: 'status_update',
      data: updateData,
      timestamp: new Date()
    });

    console.log(`[SOCKET] Sent responder update to room: ${roomName}`);
  }

  /**
   * Notify citizen about new chat message
   */
  notifyChatMessage(sosId, messageData) {
    if (!this.io) {
      console.warn('[SOCKET] Socket.io not initialized');
      return;
    }

    const roomName = `sos_${sosId}`;
    
    this.io.to(roomName).emit('new-message', {
      type: 'chat_message',
      data: messageData,
      timestamp: new Date()
    });

    console.log(`[SOCKET] Sent chat message to room: ${roomName}`);
  }

  /**
   * Notify citizen about responder location update
   */
  notifyLocationUpdate(sosId, locationData) {
    if (!this.io) {
      console.warn('[SOCKET] Socket.io not initialized');
      return;
    }

    const roomName = `sos_${sosId}`;
    
    this.io.to(roomName).emit('location-update', {
      type: 'location',
      data: locationData,
      timestamp: new Date()
    });

    console.log(`[SOCKET] Sent location update to room: ${roomName}`);
  }

  /**
   * Broadcast to all clients (e.g., disaster alerts)
   */
  broadcast(eventName, data) {
    if (!this.io) {
      console.warn('[SOCKET] Socket.io not initialized');
      return;
    }

    this.io.emit(eventName, data);
    console.log(`[SOCKET] Broadcast ${eventName} to all clients`);
  }

  /**
   * Get connected user count
   */
  getConnectedCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(citizenId) {
    return this.connectedUsers.has(citizenId);
  }

  /**
   * Generic method to emit to a specific room
   */
  emitToRoom(roomName, eventName, data) {
    if (!this.io) {
      console.warn('[SOCKET] Socket.io not initialized');
      return;
    }

    this.io.to(roomName).emit(eventName, data);
    console.log(`[SOCKET] Emitted ${eventName} to room: ${roomName}`);
  }
}

// Export singleton instance
module.exports = new SocketService();
