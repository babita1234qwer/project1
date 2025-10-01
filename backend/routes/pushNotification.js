// routes/pushNotifications.js
const express = require('express');
const notificationrouter = express.Router();
const User = require('../models/user');
const { sendPushNotification } = require('../services/pushNotification');

function successResponse(res, data, message = "Success", status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }
  
  function errorResponse(res, message = "Error", status = 500, error = null) {
    return res.status(status).json({
      success: false,
      message,
      error: error?.message || null,
    });
  }
// Register a push token for a user
notificationrouter.post('/register', async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return errorResponse(res, 'Token is required', 400);
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if the token already exists
    const existingTokenIndex = user.pushTokens.findIndex(
      (t) => t.token === token
    );

    if (existingTokenIndex !== -1) {
      // Update the existing token
      user.pushTokens[existingTokenIndex].lastUsed = Date.now();
    } else {
      // Add the new token
      user.pushTokens.push({
        token,
        lastUsed: Date.now(),
      });
    }

    await user.save();

    return successResponse(res, null, 'Push token registered successfully');
  } catch (error) {
    console.error('Error registering push token:', error);
    return errorResponse(res, 'Failed to register push token', 500, error);
  }
});

// Unregister a push token for a user
notificationrouter.post('/unregister', async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return errorResponse(res, 'Token is required', 400);
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Remove the token
    user.pushTokens = user.pushTokens.filter((t) => t.token !== token);
    await user.save();

    return successResponse(res, null, 'Push token unregistered successfully');
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return errorResponse(res, 'Failed to unregister push token', 500, error);
  }
});

// Send a push notification (admin only)
notificationrouter.post('/send', async (req, res) => {
  try {
    const { userIds, title, message, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse(res, 'User IDs are required', 400);
    }

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', 400);
    }

    // Find the users
    const users = await User.find({ _id: { $in: userIds } }).select(
      'pushTokens'
    );

    // Collect all tokens
    const tokens = [];
    users.forEach((user) => {
      user.pushTokens.forEach((tokenObj) => {
        tokens.push(tokenObj.token);
      });
    });

    if (tokens.length === 0) {
      return errorResponse(res, 'No push tokens found for the specified users', 404);
    }

    // Send the notification
    const result = await sendPushNotification(tokens, title, message, data);

    if (!result.success) {
      return errorResponse(res, 'Failed to send push notification', 500, result.error);
    }

    // Remove failed tokens
    if (result.failedTokens.length > 0) {
      await User.updateMany(
        { _id: { $in: userIds } },
        { $pull: { pushTokens: { token: { $in: result.failedTokens } } } }
      );
    }

    return successResponse(
      res,
      { sentTokens: tokens.length, failedTokens: result.failedTokens.length },
      'Push notification sent successfully'
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return errorResponse(res, 'Failed to send push notification', 500, error);
  }
});

module.exports = notificationrouter;
