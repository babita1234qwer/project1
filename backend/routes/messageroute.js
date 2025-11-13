// routes/message.js
const express = require('express');
const Messagerouter = express.Router();
const { getMessages, sendMessage } = require('../controllers/messagecontroller');
const userMiddleware=require("../middleware/usermiddeware") 


Messagerouter.get('/:emergencyId/messages', userMiddleware, getMessages);


Messagerouter.post('/:emergencyId/messages', userMiddleware, sendMessage);

module.exports = Messagerouter;