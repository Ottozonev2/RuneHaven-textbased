// firebase-config.js
// Firebase configuration for Rune Haven multiplayer features.
// Replace these placeholders with your actual Firebase project credentials.

const firebaseConfig = {
    apiKey: "AIzaSyDnGGzxXslmvPkrRurgKDfZlTuKz57zkrk",
    authDomain: "rune-haven.firebaseapp.com",
    projectId: "rune-haven",
    storageBucket: "rune-haven.firebasestorage.app",
    messagingSenderId: "929020658459",
    appId: "1:929020658459:web:81b09d705fa2d2142b09be",
    measurementId: "G-KRXST6XJR3"
};
// Initialize Firebase
// Note: We are using the web version 9+ (modular) or version 8 (compat) format.
// For simplicity in a browser-based RPG, we'll use the CDN/Compat version.
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
} else {
    console.error("Firebase SDK not loaded. Multiplayer features will be disabled.");
}
