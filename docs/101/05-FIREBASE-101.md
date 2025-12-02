# Firebase 101: Authentication & Google Identity Platform

## Table of Contents
1. [What is Firebase?](#what-is-firebase)
2. [Firebase vs Google Identity Platform](#firebase-vs-google-identity-platform)
3. [Core Concepts](#core-concepts)
4. [Setting Up Firebase](#setting-up-firebase)
5. [Authentication Methods](#authentication-methods)
6. [Integrating with Applications](#integrating-with-applications)
7. [Hands-on Exercises](#hands-on-exercises)
8. [Best Practices](#best-practices)

---

## What is Firebase?

**Firebase** is Google's platform for building mobile and web applications. It provides:
- **Authentication**: User sign-in and management
- **Database**: Real-time and Firestore databases
- **Storage**: File storage
- **Hosting**: Web hosting
- **Functions**: Serverless functions
- **Analytics**: User analytics

This guide focuses on **Firebase Authentication** and **Google Identity Platform**.

---

## Firebase vs Google Identity Platform

### Firebase Authentication

**Firebase Auth** is the consumer-facing authentication service:
- Simple setup
- Multiple providers (Email, Google, Facebook, etc.)
- Client SDKs (JavaScript, iOS, Android)
- Free tier available

**Best for:**
- Mobile apps
- Web apps
- Consumer applications
- Quick prototypes

### Google Identity Platform

**Google Identity Platform** is the enterprise version:
- Built on Firebase Auth
- More enterprise features
- Better for B2B applications
- More control and customization

**Best for:**
- Enterprise applications
- B2B services
- Applications needing advanced features
- Organizations with specific compliance needs

**Note:** For most use cases, they're the same thing. Google Identity Platform is essentially Firebase Auth with enterprise features.

---

## Core Concepts

### 1. Authentication Providers

**Supported Providers:**
- **Email/Password**: Traditional email sign-in
- **Google Sign-In**: Sign in with Google account
- **Facebook**: Sign in with Facebook
- **Twitter**: Sign in with Twitter
- **GitHub**: Sign in with GitHub
- **Anonymous**: Temporary anonymous users
- **Custom**: Your own authentication system

### 2. User Object

A **user** has:
- **UID**: Unique identifier
- **Email**: User's email
- **Display Name**: User's name
- **Photo URL**: Profile picture
- **Provider Data**: Authentication provider info
- **Custom Claims**: Additional user data

### 3. ID Tokens

An **ID token** is a JWT that:
- Proves user identity
- Contains user information
- Can be verified on backend
- Expires after 1 hour

### 4. Custom Claims

**Custom claims** are additional data stored in the ID token:
- User roles (admin, user, etc.)
- Permissions
- Organization membership
- Any custom data

---

## Setting Up Firebase

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name
4. (Optional) Enable Google Analytics
5. Click **Create project**

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable providers:
   - **Email/Password**: Click, enable, save
   - **Google**: Click, enable, save

### Step 3: Get Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click **Web** icon (`</>`)
4. Register app (name it)
5. Copy configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Authentication Methods

### Email/Password Authentication

**Sign Up:**
```javascript
import { createUserWithEmailAndPassword } from 'firebase/auth';

const userCredential = await createUserWithEmailAndPassword(
  auth,
  'user@example.com',
  'password123'
);
const user = userCredential.user;
```

**Sign In:**
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

const userCredential = await signInWithEmailAndPassword(
  auth,
  'user@example.com',
  'password123'
);
const user = userCredential.user;
```

**Sign Out:**
```javascript
import { signOut } from 'firebase/auth';

await signOut(auth);
```

### Google Sign-In

**Sign In:**
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const userCredential = await signInWithPopup(auth, provider);
const user = userCredential.user;
```

### Get Current User

```javascript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log('User:', user.uid);
  } else {
    // User is signed out
  }
});
```

### Get ID Token

```javascript
const user = auth.currentUser;
if (user) {
  const idToken = await user.getIdToken();
  // Send to backend for verification
}
```

---

## Integrating with Applications

### Frontend (React Example)

**Install:**
```bash
npm install firebase
```

**Initialize:**
```javascript
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

**Use in Component:**
```javascript
// App.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './firebase';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Sign In with Google</button>
      )}
    </div>
  );
}
```

### Backend (Node.js Example)

**Verify ID Token:**
```javascript
const admin = require('firebase-admin');

// Initialize (use service account or default credentials)
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

// Verify token in Express middleware
async function verifyToken(req, res, next) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Use in route
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'Hello, ' + req.user.email });
});
```

### Backend (Java/Spring Boot Example)

**Add dependency** (`pom.xml`):
```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

**Initialize:**
```java
@Configuration
public class FirebaseConfig {
    @PostConstruct
    public void initialize() {
        try {
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.getApplicationDefault())
                .build();
            FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

**Verify Token:**
```java
@Component
public class FirebaseAuthFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String idToken = httpRequest.getHeader("Authorization");
        
        if (idToken != null && idToken.startsWith("Bearer ")) {
            idToken = idToken.substring(7);
            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance()
                    .verifyIdToken(idToken);
                // Add user info to request
                httpRequest.setAttribute("user", decodedToken);
            } catch (FirebaseAuthException e) {
                // Invalid token
            }
        }
        chain.doFilter(request, response);
    }
}
```

---

## Hands-on Exercises

### Exercise 1: Simple Web App with Firebase Auth

1. **Create HTML file:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Firebase Auth Demo</title>
</head>
<body>
    <div id="app">
        <div id="signed-out">
            <button onclick="signIn()">Sign In with Google</button>
        </div>
        <div id="signed-in" style="display:none">
            <p>Welcome, <span id="user-email"></span>!</p>
            <button onclick="signOut()">Sign Out</button>
        </div>
    </div>

    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
        import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';

        const firebaseConfig = {
            // Your config
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        window.signIn = async () => {
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error(error);
            }
        };

        window.signOut = async () => {
            await signOut(auth);
        };

        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.getElementById('signed-out').style.display = 'none';
                document.getElementById('signed-in').style.display = 'block';
                document.getElementById('user-email').textContent = user.email;
            } else {
                document.getElementById('signed-out').style.display = 'block';
                document.getElementById('signed-in').style.display = 'none';
            }
        });
    </script>
</body>
</html>
```

2. **Test sign-in/sign-out**

### Exercise 2: Backend Token Verification

1. **Create Express server:**
```javascript
const express = require('express');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const app = express();

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/user', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000);
```

2. **Test with ID token from frontend**

### Exercise 3: Custom Claims

**Set custom claims (admin only):**
```javascript
// Backend admin function
await admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  organization: 'acme-corp'
});
```

**Read custom claims:**
```javascript
// Frontend
const user = auth.currentUser;
const idTokenResult = await user.getIdTokenResult();
console.log(idTokenResult.claims.role); // 'admin'
console.log(idTokenResult.claims.organization); // 'acme-corp'
```

---

## Best Practices

### 1. Secure Your API Keys

**Don't expose admin SDK keys:**
- Use environment variables
- Never commit keys to git
- Use service accounts for backend

### 2. Verify Tokens on Backend

**Always verify ID tokens:**
```javascript
// ✅ Good
const decoded = await admin.auth().verifyIdToken(idToken);

// ❌ Bad - trusting client
const user = JSON.parse(req.body.user);
```

### 3. Use Custom Claims for Authorization

**Store roles/permissions in custom claims:**
```javascript
await admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  permissions: ['read', 'write', 'delete']
});
```

### 4. Handle Token Refresh

**ID tokens expire after 1 hour:**
```javascript
// Frontend - auto-refresh
onIdTokenChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    // Update API calls with new token
  }
});
```

### 5. Secure Rules

**Use Security Rules for Firestore/Storage:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Project-Specific: Our Firebase Setup

Looking at this project:

**Integration:**
- **Google Identity Platform**: For authentication
- **Backend verification**: Java Spring Boot verifies ID tokens
- **Custom claims**: User roles and permissions

**Try It:**
```bash
# Check Firebase configuration
# See: docs/archive/firebase-integration/

# Test authentication flow
# 1. Sign in via frontend
# 2. Get ID token
# 3. Send to backend
# 4. Backend verifies token
```

---

## Common Issues & Solutions

### Issue: "Firebase App not initialized"

**Solution:**
```javascript
// Make sure you initialize before using
import { initializeApp } from 'firebase/app';
const app = initializeApp(firebaseConfig);
```

### Issue: "Invalid API key"

**Solution:**
- Check Firebase Console for correct config
- Ensure API key restrictions allow your domain

### Issue: "Token expired"

**Solution:**
```javascript
// Refresh token
const user = auth.currentUser;
const newToken = await user.getIdToken(true); // Force refresh
```

---

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Enable authentication providers
3. ✅ Integrate with frontend
4. ✅ Verify tokens on backend
5. ✅ Use custom claims for authorization

---

## Additional Resources

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Google Identity Platform](https://cloud.google.com/identity-platform)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Security Rules](https://firebase.google.com/docs/rules)

---

**Excellent!** You now understand Firebase Authentication. You've completed all the core technologies! 🎉

Check the [main README](./README.md) for next steps and project-specific guides!

