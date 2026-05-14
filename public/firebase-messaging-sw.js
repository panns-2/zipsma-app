importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// This is a service worker, it doesn't have access to environment variables.
// In a real production app, you might want to serve this file dynamically
// but for standard web apps, hardcoding the public config is common.

firebase.initializeApp({
  apiKey: "AIzaSyAh558UOucYesb5CDrmCFJS9pJu7q5qqBg",
  authDomain: "zip-sma.firebaseapp.com",
  projectId: "zip-sma",
  storageBucket: "zip-sma.firebasestorage.app",
  messagingSenderId: "641452454332",
  appId: "1:641452454332:web:5b665c368380c00360bbb9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
    sound: 'default' // This triggers the default notification sound
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
