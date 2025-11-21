// Quick script to get Google ID token
// Run in browser console on a page with Firebase SDK loaded
// Or use: node -e "$(cat postman/get-token.js)"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGjCJ8qOiucpMQr9lTwyccKpLnjyD_YDA",
  authDomain: "cloud-secrets-manager.firebaseapp.com",
  projectId: "cloud-secrets-manager"
};

// For browser console:
if (typeof firebase !== 'undefined') {
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  auth.signInWithEmailAndPassword("amine.lhb@gmail.com", "11432184")
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

