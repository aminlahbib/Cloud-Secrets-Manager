// Quick script to get Google ID token
// Run in browser console on a page with Firebase SDK loaded
// 
// ⚠️ SECURITY: This file uses firebase-config.js which is generated from environment variables
// DO NOT commit firebase-config.js to Git!

// Load Firebase config from generated file
let firebaseConfig;
if (typeof require !== 'undefined') {
    // Node.js environment
    firebaseConfig = require('./firebase-config.js');
} else if (typeof window !== 'undefined' && window.firebaseConfig) {
    // Browser environment (config loaded via script tag)
    firebaseConfig = window.firebaseConfig;
} else {
    throw new Error("Firebase config not found. Run setup-firebase-config.sh first or load firebase-config.js in HTML");
}

// For browser console:
if (typeof firebase !== 'undefined') {
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
  
    // ⚠️ SECURITY: Replace with your actual email and password
    const email = process.env.FIREBASE_EMAIL || "YOUR_EMAIL_HERE"; // Replace with your email
    const password = process.env.FIREBASE_PASSWORD || "YOUR_PASSWORD_HERE"; // Replace with your password
  
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.getIdToken();
        })
        .then((idToken) => {
            console.log("✅ ID Token:");
            console.log(idToken);
            console.log("\n📋 Copy this token and set it in Postman environment variable: google_id_token");
        })
        .catch((error) => {
            console.error("❌ Error:", error.message);
        });
} else {
    console.log("Firebase SDK not loaded. Use this in browser console with Firebase SDK.");
}
