
const Message = require('../models/message');
const Emergency = require('../models/emergency');


const getMessages = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { after, limit = 50 } = req.query;
    

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }
    
    const userId = req.user.id;
    const isCreator = emergency.createdBy?.toString() === userId;
    const isResponder = emergency.responders?.some(
      responder => responder.userId?.toString() === userId
    );
    
    if (!isCreator && !isResponder) {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages' });
    }
    
 
    const query = { emergency: emergencyId };
    if (after) {
      query._id = { $gt: after };
    }
    
    const messages = await Message.find(query)
      .populate('sender', 'name')
      .sort({ createdAt: -1 }) 
      .limit(parseInt(limit));
  
    const chronologicalMessages = messages.reverse();
    
    res.json({ success: true, data: chronologicalMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const sendMessage = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { content, message } = req.body;
    
  
    const messageText = content || message;
    
    if (!messageText || messageText.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }
    
    
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }
    
    const userId = req.user.id;
    const isCreator = emergency.createdBy?.toString() === userId;
    const isResponder = emergency.responders?.some(
      responder => responder.userId?.toString() === userId
    );
    
    if (!isCreator && !isResponder) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages' });
    }
    const newMessage = await Message.create({
      emergency: emergencyId,
      sender: userId,
      message: messageText.trim(),
      createdAt: new Date()
    });
    
    await newMessage.populate('sender', 'name');
   
    const { getIO } = require('../socket/socketServer');
    const io = getIO();
    
    if (io) {
      io.to(emergencyId).emit('newMessage', newMessage);
  
      io.to(`emergency-${emergencyId}`).emit('message', {
        type: 'message',
        message: newMessage
      });
    }
    

    await Emergency.findByIdAndUpdate(emergencyId, {
      lastActivity: new Date()
    });
    
    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const markMessagesRead = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ success: false, message: 'Message IDs are required' });
    }
    
    const userId = req.user.id;
    
  
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        emergency: emergencyId,
        sender: { $ne: userId }
      },
      { 
        $addToSet: { readBy: userId }
      }
    );
    

    const { getIO } = require('../socket/socketServer');
    const io = getIO();
    
    if (io) {
    
      const messages = await Message.find({ _id: { $in: messageIds } });
      for (const msg of messages) {
        if (msg.sender.toString() !== userId) {
          io.to(`user:${msg.sender}`).emit('messageRead', {
            messageId: msg._id,
            readBy: userId
          });
        }
      }
    }
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessagesRead
};