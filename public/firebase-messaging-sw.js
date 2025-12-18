importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyANrUXwBGvmbDeVF2eqTeCb8oXPNaBIIAk",
    authDomain: "familly-fun-service.firebaseapp.com",
    projectId: "familly-fun-service",
    storageBucket: "familly-fun-service.firebasestorage.app",
    messagingSenderId: "257202552832",
    appId: "1:257202552832:web:add8b7eb7672889dbdd8e5"
});

const messaging = firebase.messaging();
console.log('[firebase-messaging-sw.js] Service Worker Loaded Successfully.');

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title || '[Secret Garden]';
    const notificationOptions = {
        body: payload.notification.body || '새로운 메시지가 도착했습니다.',
        icon: 'assets/icons/icon-192.png', // Relative path to SW location
        tag: 'secret-garden-push',
        renotify: true,
        data: {
            url: payload.data ? (payload.data.url || './dashboard.html') : './dashboard.html'
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
