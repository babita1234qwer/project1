// firebase-messaging-sw.js
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
    data: payload.data,
    // Add click action
    requireInteraction: true,
    // Add badge
    badge: '/firebase-logo.png',
    // Add tag to group similar notifications
    tag: payload.data.tag || 'default'
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // This gets the URL from the notification data
  const urlToOpen = event.notification.data.url || '/';
  
  // This checks if the app is already open
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});