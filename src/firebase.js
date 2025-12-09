// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyANrUXwBGvmbDeVF2eqTeCb8oXPNaBIIAk",
    authDomain: "familly-fun-service.firebaseapp.com",
    projectId: "familly-fun-service",
    storageBucket: "familly-fun-service.firebasestorage.app",
    messagingSenderId: "257202552832",
    appId: "1:257202552832:web:add8b7eb7672889dbdd8e5"
};

// Initialize Firebase
// Note: We use the CDN scripts in HTML, so 'firebase' global object is available
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
