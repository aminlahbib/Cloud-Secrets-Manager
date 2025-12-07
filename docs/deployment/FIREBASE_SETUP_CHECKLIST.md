# Firebase Setup & Validation Checklist

> **Purpose:** Validate Firebase authentication is working end-to-end before deployment

---

## Prerequisites Checklist

### 1. Firebase Console Setup

- [ ] Firebase project exists: `cloud-secrets-manager`
- [ ] Billing plan: Blaze (pay-as-you-go) ✓
- [ ] Web app registered in Firebase Console

### 2. Authentication Provider Enabled

Go to **Firebase Console → Authentication → Sign-in method**:

- [ ] **Google** sign-in provider is **Enabled**
- [ ] Support email is configured
- [ ] Authorized domains include:
  - `localhost` (for local development)
  - `cloud-secrets-manager.firebaseapp.com`
  - Your production domain (when ready)

### 3. Web App Configuration

Go to **Firebase Console → Project Settings → Your apps → Web app**:

You need these values for the frontend `.env` file:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 4. Service Account Key (Backend)

Go to **Firebase Console → Project Settings → Service accounts**:

- [ ] Click **"Generate new private key"**
- [ ] Save the JSON file to: `infrastructure/gcp/keys/firebase-admin-key.json`
- [ ] **NEVER commit this file to Git** (it's in .gitignore)

---

## Local Environment Setup

### Frontend (.env.local)

Create `apps/frontend/.env.local`:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=cloud-secrets-manager.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloud-secrets-manager
VITE_FIREBASE_STORAGE_BUCKET=cloud-secrets-manager.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Backend (docker/.env)

Create or update `docker/.env`:

```bash
# Enable Firebase authentication
GOOGLE_IDENTITY_ENABLED=true
GOOGLE_PROJECT_ID=cloud-secrets-manager
GOOGLE_SERVICE_ACCOUNT_PATH=/app/firebase-admin-key.json
```

### Docker Compose Volume Mount

Verify `docker/docker-compose.yml` has the volume mount:

```yaml
services:
  secret-service:
    volumes:
      - ../infrastructure/gcp/keys/firebase-admin-key.json:/app/firebase-admin-key.json:ro
```

---

## Validation Steps

### Step 1: Verify Firebase Key Exists

```bash
# Check the key file exists
ls -la infrastructure/gcp/keys/firebase-admin-key.json

# Should show the file (not a directory)
# File size should be ~2KB
```

### Step 2: Start Services

```bash
cd docker
docker compose up --build
```

### Step 3: Check Backend Logs

Look for these log messages:

**✓ Success:**
```
Firebase Admin SDK initialized successfully for project: cloud-secrets-manager
```

**✗ Failure:**
```
Firebase service account file not found
```

### Step 4: Test Frontend Login

1. Open http://localhost:5173 (or the frontend port)
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Check browser console for errors

### Step 5: Verify Token in Backend

After successful login, the frontend should:
1. Get a Firebase ID token
2. Send it to the backend
3. Backend validates and returns access token

Check backend logs for:
```
Successfully validated Firebase token for user: your-email@gmail.com
```

---

## Common Issues & Solutions

### Issue: "Firebase not initialized"

**Cause:** Service account key not found or path incorrect

**Solution:**
1. Verify file exists: `ls -la infrastructure/gcp/keys/firebase-admin-key.json`
2. Verify it's a file (not directory)
3. Check Docker volume mount in `docker-compose.yml`

### Issue: "auth/popup-blocked"

**Cause:** Browser blocking popup

**Solution:**
1. Allow popups for localhost
2. Or use redirect method instead of popup

### Issue: "auth/unauthorized-domain"

**Cause:** Domain not in Firebase authorized list

**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Add `localhost` to authorized domains

### Issue: "Invalid ID token"

**Cause:** Token expired or wrong project

**Solution:**
1. Force token refresh: `await user.getIdToken(true)`
2. Verify `GOOGLE_PROJECT_ID` matches Firebase project

---

## Production Checklist

Before deploying to production:

- [ ] Firebase service account key stored in Google Secret Manager
- [ ] External Secrets Operator configured to sync the key
- [ ] `googleIdentity.enabled: true` in Helm values
- [ ] Authorized domains include production URL
- [ ] Rate limiting configured for auth endpoints

---

*Last Updated: December 2025*
