
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  emergency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);