// services/pushNotification.js
const admin = require('firebase-admin');

// Initialize Firebase Admin (do this once at app startup)
const serviceAccount = require('./path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// services/pushNotification.js
const sendPushNotification = async (tokens, notificationDoc) => {
  const message = {
    notification: {
      title: notificationDoc.title,
      body: notificationDoc.message,
    },
    data: {
      _id: notificationDoc._id,
      userId: notificationDoc.userId,
      emergencyId: notificationDoc.emergencyId,
      type: notificationDoc.type,
      title: notificationDoc.title,
      message: notificationDoc.message,
      status: notificationDoc.status,
      createdAt: notificationDoc.createdAt,
      // Include any other fields you need in the frontend
    },
    tokens: Array.isArray(tokens) ? tokens : [tokens]
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log('Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('Push notification error:', error);
    throw error;
  }
};
module.exports = { sendPushNotification };