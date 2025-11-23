# Get Google ID Token - Quick Guide 

## **Method 1: Use HTML Helper (Easiest)**

1. **Open the HTML file:**
   ```bash
   open get-id-token.html
   ```
   Or navigate to: `get-id-token.html` in your browser

2. **The form is pre-filled with:**
   - Email: `amine.lhb@gmail.com`
   - Password: Enter `11432184`

3. **Click "Get ID Token"**

4. **Copy the token** that appears

5. **Use in Postman:**
   - Open Postman
   - Select environment: "Cloud Secrets Manager - Local"
   - Set variable: `google_id_token` = (paste your token)

---

## **Method 2: Browser Console (Alternative)**

1. **Open any webpage** (or create a simple HTML file with Firebase SDK)

2. **Open browser console** (F12 or Cmd+Option+I)

3. **Load Firebase SDK:**
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
   ```

4. **Run this code:**
   ```javascript
   const firebaseConfig = {
       apiKey: "AIzaSyBGjCJ8qOiucpMQr9lTwyccKpLnjyD_YDA",
       authDomain: "cloud-secrets-manager.firebaseapp.com",
       projectId: "cloud-secrets-manager"
   };
   
   firebase.initializeApp(firebaseConfig);
   const auth = firebase.auth();
   
   auth.signInWithEmailAndPassword("amine.lhb@gmail.com", "11432184")
       .then((userCredential) => {
           return userCredential.user.getIdToken();
       })
       .then((idToken) => {
           console.log(" ID Token:", idToken);
           // Copy this token
       })
       .catch((error) => {
           console.error(" Error:", error.message);
       });
   ```

5. **Copy the token** from console

---

## **After Getting Token**

1. **Set in Postman:**
   - Environment: "Cloud Secrets Manager - Local"
   - Variable: `google_id_token`
   - Value: (paste your token)

2. **Test Login:**
   - Go to: **Authentication**  **Login with Google ID Token**
   - Click **Send**
   - Should get JWT token in response

3. **Use JWT Token:**
   - JWT token is automatically saved to `jwt_token` variable
   - Use it for all authenticated requests

---

## **Quick Test**

After setting the token in Postman, test it:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_ID_TOKEN_HERE"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

---

**Your Credentials:**
- Email: `amine.lhb@gmail.com`
- Password: `11432184`
- Project ID: `cloud-secrets-manager`

