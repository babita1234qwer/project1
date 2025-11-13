// socket/socketServer.js
const { Server } = require("socket.io");
const ChatMessage = require('../models/chatMessages');
const Emergency = require('../models/emergency');
const User = require('../models/user');

let io;

const initializeSocket = (server) => {
  // Allowed origins: dev and production
  const allowedOrigins = [
    process.env.FRONTEND_URL_DEV || "http://localhost:5173",
    process.env.FRONTEND_URL_PROD || "https://reliable-dasik-5b9a63.netlify.app"
  ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ----- User-specific notifications -----
    socket.on('joinRoom', ({ userId }) => {
      if (!userId) return;
      const room = `user:${userId}`;
      socket.join(room);
      console.log(`✅ User ${userId} joined room: ${room}`);
    });

    // ----- Emergency chat rooms -----
    socket.on('joinEmergencyRoom', async ({ emergencyId, userId }) => {
      try {
        const emergency = await Emergency.findById(emergencyId);
        if (!emergency) {
          socket.emit('error', 'Emergency not found.');
          return;
        }

        const reporterId = emergency.reporter?.toString();
        const isCreator = reporterId === userId;

        let isResponder = false;
        if (Array.isArray(emergency.responders)) {
          isResponder = emergency.responders.some(
            r => r.userId?.toString() === userId
          );
        }

        if (!isCreator && !isResponder) {
          socket.emit('error', 'You are not authorized to join this chat.');
          return;
        }

        const room = `emergency:${emergencyId}`;
        socket.join(room);
        console.log(`✅ User ${userId} joined emergency room ${room}`);
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

    // ----- Handle chat messages -----
    socket.on('chatMessage', async ({ emergencyId, userId, message }) => {
      try {
        const newMessage = new ChatMessage({
          emergency: emergencyId,
          sender: userId,
          message
        });

        await newMessage.save();
        await newMessage.populate('sender', 'name');

        const room = `emergency:${emergencyId}`;
        io.to(room).emit('newMessage', newMessage);

      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', 'Could not send message.');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

// ----- Get initialized Socket.IO instance -----
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

// ----- Helper functions for emitting events -----
const emitToUser = (userId, event, data) => {
  if (io) {
    const room = `user:${userId}`;
    io.to(room).emit(event, data);
  }
};

const emitToEmergency = (emergencyId, event, data) => {
  if (io) {
    const room = `emergency:${emergencyId}`;
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
