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
    console.log('[SW] Background message received:', payload);

    // notification 또는 data에서 제목/본문 추출
    const notificationTitle =
        (payload.notification && payload.notification.title) ||
        (payload.data && payload.data.title) ||
        '[Secret Garden]';

    const notificationBody =
        (payload.notification && payload.notification.body) ||
        (payload.data && payload.data.body) ||
        '새로운 메시지가 도착했습니다.';

    const notificationOptions = {
        body: notificationBody,
        icon: '/assets/icons/icon-192.png',  // 절대 경로
        badge: '/assets/icons/icon-192.png',
        tag: 'secret-garden-push',
        renotify: true,
        requireInteraction: false,
        data: {
            url: (payload.data && payload.data.url) || './dashboard.html'
        }
    };

    console.log('[SW] Showing notification:', notificationTitle, notificationOptions);
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
