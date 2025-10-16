// socket/socketServer.js
const { Server } = require("socket.io");
const ChatMessage = require('../models/chatMessages');
const Emergency = require('../models/emergency');
const User = require('../models/user');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join user-specific room for notifications
    socket.on('joinRoom', ({ userId }) => {
      if (!userId) return;
      const room = `user:${userId.toString()}`;
      socket.join(room);
      console.log(`✅ User ${userId} joined room: ${room}`);
    });

    // Join emergency room for chat
    socket.on('joinEmergencyRoom', async ({ emergencyId, userId }) => {
      try {
        const emergency = await Emergency.findById(emergencyId);
        
        if (!emergency) {
          socket.emit('error', 'Emergency not found.');
          return;
        }

        const reporterId = emergency.reporter ? emergency.reporter.toString() : null;
        const isCreator = reporterId === userId;
        
        let isResponder = false;
        if (emergency.responders && Array.isArray(emergency.responders)) {
          isResponder = emergency.responders.some(r => r.userId && r.userId.toString() === userId);
        }

        if (!isCreator && !isResponder) {
          socket.emit('error', 'You are not authorized to join this chat.');
          return;
        }

        socket.join(emergencyId);
        console.log(`SUCCESS: User ${userId} joined room ${emergencyId}`);
        socket.emit('joinedRoom', emergencyId);

        const messages = await ChatMessage.find({ emergency: emergencyId })
          .populate('sender', 'name')
          .sort('createdAt');
        socket.emit('chatHistory', messages);

      } catch (error) {
        console.error('Error in joinEmergencyRoom:', error);
        socket.emit('error', 'Failed to join chat room.');
      }
    });

    // Handle chat messages
    socket.on('chatMessage', async (data) => {
      const { emergencyId, userId, message } = data;
      
      try {
        const newMessage = new ChatMessage({
          emergency: emergencyId,
          sender: userId,
          message,
        });

        await newMessage.save();
        await newMessage.populate('sender', 'name');

        io.to(emergencyId).emit('newMessage', newMessage);

      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit('error', 'Could not send message.');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Helper functions for emitting events
const emitToUser = (userId, event, data) => {
  if (io) {
    const room = `user:${String(userId)}`;
    io.to(room).emit(event, data);
  }
};

const emitToEmergency = (emergencyId, event, data) => {
  if (io) {
    const room = `emergency:${String(emergencyId)}`;
    io.to(room).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = { 
  initializeSocket, 
  getIO,
  emitToUser,
  emitToEmergency,
  emitToAll
};