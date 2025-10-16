const express = require('express');
const http = require('http');
const redisclient = require("./config/redis");
// --- REMOVED: The old socket utility is no longer needed ---
// const socket = require('./config/socket'); 
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const main = require('./config/db');
const cookieparser = require('cookie-parser');
const cors = require('cors');
const authrouter = require('./routes/userauth');
const emergencyRouter = require('./routes/emergency');
const notificationRouter = require("./routes/notification");
const locationrouter=require("./routes/location");
const notificationrouter=require("./routes/pushNotification");
const Reviewrouter = require('./routes/websiteReviewRoutes');
const Donationrouter = require('./routes/donationRoutes');
const { initNotificationSocket } = require('./controllers/notificationcontroller');
// --- This import is correct and stays ---
const { initializeSocket } = require('./socket/socketServer');

const app = express();
const server = http.createServer(app);

// --- REMOVED: The old socket initialization and event handlers ---
// This logic is now handled inside the new `initializeSocket` function
// const io = socket.init(server);
// io.on('connection', (socket) => { ... });
// global.io = io;

// --- ADDED: Initialize the new, more powerful Socket.IO server ---
// This single line replaces all the old socket logic above
initializeSocket(server);


app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true 
}));

app.use(express.json());
app.use(cookieparser());

app.use('/user', authrouter);
app.use('/emergencies', emergencyRouter);
app.use('/location', locationrouter);
app.use("/notifications",notificationRouter);
app.use('/pushnotification',notificationrouter);
app.use('/reviews', Reviewrouter);
app.use('/donation', Donationrouter);

const initialiseconnection = async () => {
  try {
    await Promise.all([main(), redisclient.connect()]);
    console.log("Connected to DB");
    
    server.listen(3001, () => {
      console.log("Server running on port", 3001);
    });
  } catch(err) {
    console.log("Error connecting to DB", err);
  }
};

initialiseconnection();