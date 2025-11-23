# Firebase Integration Setup Guide

This guide will walk you through setting up Google Cloud Identity Platform (Firebase Authentication) for the Cloud Secrets Manager.

## ✅ Integration Status

**Status:** ✅ Fully Functional in Local Development  
**Completed:** November 23, 2025  
**Tested User:** `amine.lhb00@gmail.com`

**What's Working:**
- ✅ Google OAuth sign-in via Firebase
- ✅ Token exchange (Firebase ID token → Backend JWT)
- ✅ Protected route access
- ✅ User session management
- ✅ Logout functionality

**See:** [`FIREBASE_INTEGRATION_SUCCESS.md`](./FIREBASE_INTEGRATION_SUCCESS.md) for detailed test results and deployment status.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Testing the Integration](#testing-the-integration)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google Cloud Project: `cloud-secrets-manager`
- Google Cloud SDK installed and authenticated
- Firebase Admin SDK service account created
- Node.js and npm installed (for frontend)
- kubectl configured for your GKE cluster (for Kubernetes deployment)

---

## Backend Setup

### Step 1: Verify Service Account and Permissions

The Firebase Admin SDK service account should already be created with the necessary permissions:

```bash
# Verify the service account exists
gcloud iam service-accounts list --filter="displayName:Firebase Admin SDK"

# Verify IAM roles
gcloud projects get-iam-policy cloud-secrets-manager \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:firebase-adminsdk@cloud-secrets-manager.iam.gserviceaccount.com" \
  --format="table(bindings.role)"

# Expected roles:
# - roles/firebase.admin
# - roles/identityplatform.admin
```

### Step 2: Service Account Key

The service account key should be located at:
```
infrastructure/gcp/keys/firebase-admin-key.json
```

⚠️ **Security Note**: This file contains sensitive credentials and is already in `.gitignore`. Never commit it to version control!

### Step 3: Configure Backend Application

The backend `application.yml` is already configured. To enable Firebase:

```yaml
google:
  cloud:
    identity:
      enabled: true  # Set to true to enable Firebase
      project-id: cloud-secrets-manager
      service-account-path: /etc/secrets/firebase-admin-key.json
```

For local development, you can override with environment variables:

```bash
export GOOGLE_IDENTITY_ENABLED=true
export GOOGLE_PROJECT_ID=cloud-secrets-manager
export GOOGLE_SERVICE_ACCOUNT_PATH=./infrastructure/gcp/keys/firebase-admin-key.json
```

### Step 4: Deploy to Kubernetes

#### Create the Kubernetes Secret

```bash
# Create the firebase-admin-key secret in your namespace
kubectl create secret generic firebase-admin-key \
  --from-file=firebase-admin-key.json=infrastructure/gcp/keys/firebase-admin-key.json \
  --namespace=default

# Verify the secret was created
kubectl get secret firebase-admin-key -n default
```

#### Update Helm Values

Edit `infrastructure/helm/cloud-secrets-manager/values.yaml`:

```yaml
googleIdentity:
  enabled: true  # Enable Firebase
  projectId: "cloud-secrets-manager"
  setupEnabled: false  # Set to true only for initial setup
```

#### Deploy with Helm

```bash
# Deploy or upgrade
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace default \
  --values infrastructure/helm/cloud-secrets-manager/values.yaml

# Verify deployment
kubectl get pods -n default
kubectl logs -f deployment/secret-service -n default
```

---

## Frontend Setup

### Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `cloud-secrets-manager`
3. Click on the gear icon (⚙️) → Project settings
4. Scroll down to "Your apps" section
5. If no web app exists, click "Add app" → Web (</>) → Register app
6. Copy the Firebase configuration

### Step 2: Configure Frontend Environment

Create `apps/frontend/.env.local` (already in `.gitignore`):

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cloud-secrets-manager.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloud-secrets-manager
VITE_FIREBASE_STORAGE_BUCKET=cloud-secrets-manager.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1040913502384
VITE_FIREBASE_APP_ID=1:1040913502384:web:...

# Backend API URL
VITE_API_BASE_URL=http://localhost:8080
```

### Step 3: Enable Google Sign-In Provider

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Authentication → Sign-in method
3. Click on "Google" in the providers list
4. Toggle "Enable"
5. Set the project support email
6. Click "Save"

### Step 4: Build and Run Frontend

```bash
cd apps/frontend

# Install dependencies (if not already done)
npm install

# Run in development mode
npm run dev

# Or build for production
npm run build
npm run preview
```

---

## Testing the Integration

### Test 1: Backend Firebase Token Validation

```bash
# Start the backend (if running locally)
cd apps/backend/secret-service
./mvnw spring-boot:run

# The backend should log:
# "Firebase Admin SDK initialized successfully for project: cloud-secrets-manager"
```

### Test 2: Frontend Google Sign-In

1. Open the frontend: http://localhost:5173 (or your configured URL)
2. You should see the login page with a "Sign in with Google" button
3. Click "Sign in with Google"
4. Select your Google account
5. After successful authentication, you should be redirected to `/secrets`

### Test 3: API Authentication with Firebase Token

```bash
# Get a Firebase ID token (after signing in via frontend)
# Check browser console or sessionStorage for the token

# Test authenticated endpoint
curl -X GET http://localhost:8080/api/v1/secrets \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"

# Should return 200 with secrets list (or empty array for new user)
```

### Test 4: Custom Claims (Roles & Permissions)

#### Using the Backend API (Setup Endpoint)

If `setup.enabled=true` in your configuration:

```bash
# Set roles for a user
curl -X POST http://localhost:8080/api/setup/user/roles \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "FIREBASE_USER_UID",
    "roles": ["ADMIN", "USER"]
  }'

# Set permissions for a user
curl -X POST http://localhost:8080/api/setup/user/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "FIREBASE_USER_UID",
    "permissions": ["SECRET_CREATE", "SECRET_READ", "SECRET_UPDATE", "SECRET_DELETE"]
  }'
```

#### Using Firebase Admin SDK Directly

```bash
# Using gcloud CLI with firebase SDK
firebase auth:export users.json --project cloud-secrets-manager
firebase auth:import users.json --project cloud-secrets-manager
```

#### Important Notes on Custom Claims

1. **Re-authentication Required**: After setting custom claims, the user must sign out and sign back in for the new claims to take effect
2. **Token Refresh**: Claims are embedded in the ID token. New tokens automatically include updated claims
3. **Default Role**: Users without custom claims default to "USER" role

---

## Troubleshooting

### Issue: "Firebase Admin SDK initialization failed"

**Symptoms**: Backend logs show Firebase initialization errors

**Solutions**:
1. Verify the service account key file exists and is readable
2. Check the path in `GOOGLE_SERVICE_ACCOUNT_PATH` matches the actual location
3. Ensure the service account has the required IAM roles
4. For Kubernetes, verify the secret is mounted correctly:
   ```bash
   kubectl describe pod SECRET_SERVICE_POD_NAME -n default
   # Check Mounts section for /etc/secrets
   ```

### Issue: "Google sign-in popup blocked"

**Symptoms**: Clicking "Sign in with Google" doesn't open a popup

**Solutions**:
1. Enable popups in your browser for the application domain
2. Check browser console for blocked popup errors
3. Ensure Firebase configuration is correct (check `.env.local`)

### Issue: "Token validation failed"

**Symptoms**: API returns 401 Unauthorized even with a Firebase token

**Solutions**:
1. Verify Firebase is enabled in backend (`google.cloud.identity.enabled=true`)
2. Check backend logs for Firebase initialization status
3. Ensure the token hasn't expired (Firebase tokens expire after 1 hour)
4. Verify the service account has `identityplatform.admin` role
5. Check that the Firebase project ID matches in both frontend and backend config

### Issue: "User has no roles or permissions"

**Symptoms**: Authenticated user cannot perform operations

**Solutions**:
1. Set custom claims using the setup endpoint or Firebase Admin SDK
2. Ensure the user has signed out and back in after claims were set
3. Verify claims in the token:
   ```javascript
   // In browser console after signing in
   const user = firebase.auth().currentUser;
   user.getIdTokenResult().then(token => console.log(token.claims));
   ```
4. Check backend logs for extracted roles and permissions

### Issue: "Cross-Origin Request Blocked (CORS)"

**Symptoms**: Frontend cannot connect to backend API

**Solutions**:
1. Configure CORS in backend SecurityConfig if testing locally
2. Ensure the backend allows the frontend origin
3. For production, use same domain or configure CORS properly

### Issue: "Module not found: firebase"

**Symptoms**: Frontend build fails with Firebase import errors

**Solutions**:
1. Ensure Firebase is installed:
   ```bash
   cd apps/frontend
   npm install firebase
   ```
2. Check `package.json` includes `firebase` dependency
3. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Local Development vs Production

### Local Development

- Use `.env.local` for Firebase config
- Run backend with local service account key
- Firebase authentication works with `localhost`
- CORS may need to be configured

### Production (GKE)

- Firebase config passed via environment variables in Kubernetes deployment
- Service account key mounted as Kubernetes secret
- Use proper domain for Firebase `authDomain`
- CORS configured for production domain
- Ingress handles TLS and routing

---

## Security Best Practices

1. **Never commit** service account keys or Firebase config with sensitive data
2. **Rotate** service account keys periodically
3. **Use** separate Firebase projects for dev/staging/prod if needed
4. **Enable** Firebase security rules to restrict access
5. **Monitor** Firebase Authentication logs for suspicious activity
6. **Limit** service account permissions to only what's needed
7. **Use** custom claims for fine-grained access control

---

## References

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Cloud Identity Platform](https://cloud.google.com/identity-platform/docs)
- [Custom Claims and Security Rules](https://firebase.google.com/docs/auth/admin/custom-claims)

