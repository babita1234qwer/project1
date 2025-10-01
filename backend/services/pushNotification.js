// services/pushNotification.js
// services/pushNotification.js
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendPushNotification = async (tokens, title, message, data = {}) => {
  console.log(`\n🚀 Sending push notification to ${tokens.length} token(s).`);
  console.log('Title:', title);
  console.log('Message:', message);
  console.log('Data:', data);

  try {
    const payload = {
      notification: {
        title,
        body: message,
      },
      data,
    };

    const options = {
      priority: 'high',
      timeToLive: 60 * 60 * 24, // 24 hours
    };

    const response = await admin.messaging().sendToDevice(tokens, payload, options);
    console.log('✅ Firebase Raw Response:', response); // <-- CHECK THIS LOG
    console.log(`- Success count: ${response.successCount}`);
    console.log(`- Failure count: ${response.failureCount}`);
    
    // Check for failures and handle them
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          failedTokens.push(tokens[index]);
          console.error('Failure sending notification to', tokens[index], error);
        }
      });
      return { success: true, failedTokens };
    }
    
    return { success: true, failedTokens: [] };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error };
  }
};

module.exports = { sendPushNotification };