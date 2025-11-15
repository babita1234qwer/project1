
const Notification = require("../models/notification");


const successResponse = (res, data, message = "Success", status = 200) => {
  return res.status(status).json({
    ok: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const errorResponse = (res, message = "Error", status = 500, details = null) => {
  return res.status(status).json({
    ok: false,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
};


async function getUserNotifications(req, res) {
  try {
    const userId = req.user._id; 
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return successResponse(res, notifications, "Fetched notifications");
  } catch (err) {
    console.error("getUserNotifications error:", err);
    return errorResponse(res, "Could not fetch notifications", 500, err);
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id; 

    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { status: "read", readAt: Date.now() } },
      { new: true }
    );

    if (!updated) {
      return errorResponse(res, "Notification not found", 404);
    }

    return successResponse(res, updated, "Notification marked as read");
  } catch (err) {
    console.error("markNotificationAsRead error:", err);
    return errorResponse(res, "Failed to update notification", 500, err);
  }
}

async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = req.user._id; 

    const result = await Notification.updateMany(
      { userId, status: { $ne: "read" } },
      { $set: { status: "read", readAt: Date.now() } }
    );

    return successResponse(
      res,
      { updatedCount: result.modifiedCount || result.nModified },
      "All notifications marked as read"
    );
  } catch (err) {
    console.error("markAllNotificationsAsRead error:", err);
    return errorResponse(res, "Failed bulk update", 500, err);
  }
}

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};