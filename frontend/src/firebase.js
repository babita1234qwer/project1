import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAxP9NCk8XqnVBbZtG_JuHI8upxNjx6Yws",
  authDomain: "helpnet-2207c.firebaseapp.com",
  projectId: "helpnet-2207c",
  storageBucket: "helpnet-2207c.firebasestorage.app",
  messagingSenderId: "382931004642",
  appId: "1:382931004642:web:bbdd5a052a9c06b87b42bb",
  measurementId: "G-YXB10FWT6M"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Get FCM token
export const getOrRegisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service worker registered:', registration);
        return registration;
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
        throw err;
      });
  } else {
    console.log('Service workers not supported');
    return Promise.reject('Service workers not supported');
  }
};

export const getFirebaseToken = async (setTokenFound) => {
  try {
    const registration = await getOrRegisterServiceWorker();
    const currentToken = await getToken(messaging, {
      vapidKey: "BF3dz4nc76D-MAFtdq6n_H-VlJ2aWi7H352foHqkRT8hM6tnEKPXH0hxl5L6HpU1G1mBPbVOi_7m9pkkRo7g-i4",
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      setTokenFound(true);
      return currentToken;
    } else {
      console.log('No registration token available');
      setTokenFound(false);
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token:', err);
    setTokenFound(false);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });