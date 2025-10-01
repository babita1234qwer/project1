const express = require('express');
const notificationRouter = express.Router();
const { getUserNotifications,markNotificationAsRead,markAllNotificationsAsRead} = require('../controllers/notificationcontroller');
const userMiddleware = require('../middleware/usermiddeware');

notificationRouter.get('/',userMiddleware,getUserNotifications);
notificationRouter.patch("/:id/read",userMiddleware,markNotificationAsRead);
notificationRouter.patch("/read-all",userMiddleware,markAllNotificationsAsRead);
module.exports=notificationRouter;