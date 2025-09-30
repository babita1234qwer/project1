importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAxP9NCk8XqnVBbZtG_JuHI8upxNjx6Yws",
  authDomain: "helpnet-2207c.firebaseapp.com",
  projectId: "helpnet-2207c",
  storageBucket: "helpnet-2207c.firebasestorage.app",
  messagingSenderId: "382931004642",
  appId: "1:382931004642:web:bbdd5a052a9c06b87b42bb",
  measurementId: "G-YXB10FWT6M"
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png',
    data: payload.data
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});