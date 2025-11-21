// Quick script to get Google ID token
// Run in browser console on a page with Firebase SDK loaded
// 
// ⚠️ SECURITY: Replace the placeholder values below with your actual credentials
// DO NOT commit this file with real credentials to Git!

// Firebase configuration
// Get your API key from: Google Cloud Console → Identity Platform → Settings
const firebaseConfig = {
  apiKey: "AIzaSyDxggetGsbDA9zFHp0iGa5Zb4Y97qb7qLg",
  authDomain: "cloud-secrets-manager.firebaseapp.com",
  projectId: "cloud-secrets-manager"
};

// For browser console:
if (typeof firebase !== 'undefined') {
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // ⚠️ SECURITY: Replace with your actual email and password
  const email = "YOUR_EMAIL_HERE"; // Replace with your email
  const password = "YOUR_PASSWORD_HERE"; // Replace with your password
  
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

