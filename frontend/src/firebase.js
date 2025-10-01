// firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAxP9NCk8XqnVBbZtG_JuHI8upxNjx6Yws",
  authDomain: "helpnet-2207c.firebaseapp.com",
  projectId: "helpnet-2207c",
  storageBucket: "helpnet-2207c.firebasestorage.app",
  messagingSenderId: "382931004642",
  appId: "1:382931004642:web:bbdd5a052a9c06b87b42bb",
  measurementId: "G-YXB10FWT6M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export default app;