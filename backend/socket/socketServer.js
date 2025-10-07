// socket/socketServer.js

const { Server } = require("socket.io");
const ChatMessage = require('../models/chatMessages'); // Corrected model name
const Emergency = require('../models/emergency'); // Assuming you have this
const User = require('../models/user'); // Assuming you have this

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Allow your frontend URL
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room specific to an emergency
    socket.on('joinEmergencyRoom', async ({ emergencyId, userId }) => {
      try {
        // --- DEBUGGING LOG 1: Check what data is received from the client ---
        console.log('--- Attempting to join room ---');
        console.log('Received emergencyId:', emergencyId);
        console.log('Received userId:', userId);
        console.log('----------------------------------');

        // --- DEBUGGING LOG 2: Check the database query ---
        const emergency = await Emergency.findById(emergencyId);
        console.log('Fetched emergency from DB:', emergency);
        
        if (!emergency) {
          console.log('ERROR: Emergency not found.');
          socket.emit('error', 'Emergency not found.');
          return;
        }

        // --- DEBUGGING LOG 3: Check the data structure of the emergency object ---
        console.log('Emergency Reporter ID:', emergency.reporter);
        console.log('Emergency Responders Array:', emergency.responders);
        
        // --- THIS IS WHERE THE CRASH LIKELY HAPPENS ---
        // We will check if the properties exist before calling .toString()
        const reporterId = emergency.reporter ? emergency.reporter.toString() : null;
        console.log('Reporter ID (as string):', reporterId);

        const isCreator = reporterId === userId;
        console.log(`Is user (${userId}) the creator? ${isCreator}`);

        // Check if the responders array exists and is not empty
        let isResponder = false;
        if (emergency.responders && Array.isArray(emergency.responders)) {
          isResponder = emergency.responders.some(r => r.userId && r.userId.toString() === userId);
        }
        console.log(`Is user (${userId}) a responder? ${isResponder}`);

        if (!isCreator && !isResponder) {
          console.log('ERROR: User is not authorized.');
          socket.emit('error', 'You are not authorized to join this chat.');
          return;
        }

        // If we get here, authorization is successful
        socket.join(emergencyId);
        console.log(`SUCCESS: User ${userId} joined room ${emergencyId}`);
        socket.emit('joinedRoom', emergencyId);

        // Optionally, send recent chat history
        const messages = await ChatMessage.find({ emergency: emergencyId })
          .populate('sender', 'name')
          .sort('createdAt');
        socket.emit('chatHistory', messages);

      } catch (error) {
        // --- DEBUGGING LOG 4: Catch any unexpected errors ---
        console.error('!!! CATCH: An unexpected error occurred in joinEmergencyRoom !!!');
        console.error('Full Error Stack:', error); // This will show you the exact line and error type
        console.error('----------------------------------------------------');
        socket.emit('error', 'Failed to join chat room.');
      }
    });

    // Handle sending a chat message
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

        // Broadcast the message to everyone in the room
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

module.exports = { initializeSocket, getIO };