// services/pushNotification.js
import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';
import axiosClient from '../axiosClient'; // Import your custom axios instance

// Register push token
export const registerPushToken = async (token) => {
  try {
    const response = await axiosClient.post(
      '/push-notifications/register',
      { token }
      // No need for Authorization header as withCredentials handles it
    );
    return response.data;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
};

// Unregister push token
export const unregisterPushToken = async (token) => {
  try {
    const response = await axiosClient.post(
      '/push-notifications/unregister',
      { token }
      // No need for Authorization header as withCredentials handles it
    );
    return response.data;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    throw error;
  }
};

// Request permission and get token
export const requestPermissionAndGetToken = async () => {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Get token
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });

    if (!token) {
      throw new Error('Failed to get push token');
    }

    // Register token
    await registerPushToken(token);

    return token;
  } catch (error) {
    console.error('Error requesting permission and getting token:', error);
    throw error;
  }
};

// Handle incoming messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    messaging.onMessage((payload) => {
      resolve(payload);
    });
  });