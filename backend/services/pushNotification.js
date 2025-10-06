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
    // Use sendMulticast with the correct structure
    const response = await admin.messaging().sendMulticast({
      tokens,
      notification: {
        title,
        body: message,
      },
      data,
      android: {
        priority: 'high',
        ttl: 86400, // 24 hours in seconds
      },
      apns: {
        headers: {
          'apns-expiration': `${Math.floor(Date.now() / 1000) + 86400}`, // 24 hours from now
        },
      },
    });
    
    console.log('✅ Firebase Raw Response:', response);
    console.log(`- Success count: ${response.successCount}`);
    console.log(`- Failure count: ${response.failureCount}`);
    
    // Check for failures and handle them
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((result, index) => {
        if (!result.success) {
          failedTokens.push(tokens[index]);
          console.error('Failure sending notification to', tokens[index], result.error);
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