const express = require('express');
const notificationrouter = express.Router();
const User = require('../models/user');
const { sendPushNotification } = require('../services/pushNotification');

// Helper functions for consistent responses
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
// NOTE: Now requires 'userId' in the request body.
notificationrouter.post('/register', async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token) {
      return errorResponse(res, 'Token is required', 400);
    }
    if (!userId) {
      return errorResponse(res, 'User ID is required', 400);
    }

    // Find the user by the ID from the request body
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if the token already exists
    const existingTokenIndex = user.pushTokens.findIndex(
      (t) => t.token === token
    );

    if (existingTokenIndex !== -1) {
      // Update the existing token's last used timestamp
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
// NOTE: Now requires 'userId' in the request body.
notificationrouter.post('/unregister', async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token) {
      return errorResponse(res, 'Token is required', 400);
    }
    if (!userId) {
      return errorResponse(res, 'User ID is required', 400);
    }

    // Find the user by the ID from the request body
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Remove the token from the user's list
    user.pushTokens = user.pushTokens.filter((t) => t.token !== token);
    await user.save();

    return successResponse(res, null, 'Push token unregistered successfully');
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return errorResponse(res, 'Failed to unregister push token', 500, error);
  }
});

// Send a push notification
// NOTE: No authentication middleware. Anyone can call this endpoint.
notificationrouter.post('/send', async (req, res) => {
  try {
    const { userIds, title, message, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse(res, 'User IDs are required', 400);
    }

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', 400);
    }

    // Find all specified users and retrieve their push tokens
    const users = await User.find({ _id: { $in: userIds } }).select(
      'pushTokens'
    );

    // Collect all unique tokens from the found users
    const tokens = [];
    users.forEach((user) => {
      user.pushTokens.forEach((tokenObj) => {
        tokens.push(tokenObj.token);
      });
    });

    if (tokens.length === 0) {
      return errorResponse(res, 'No push tokens found for the specified users', 404);
    }

    // Send the notification using the service
    const result = await sendPushNotification(tokens, title, message, data);

    if (!result.success) {
      return errorResponse(res, 'Failed to send push notification', 500, result.error);
    }

    // If any tokens failed, remove them from the database to prevent future errors
    if (result.failedTokens && result.failedTokens.length > 0) {
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