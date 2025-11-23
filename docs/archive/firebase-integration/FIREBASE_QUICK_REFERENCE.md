# Firebase Integration - Quick Reference

## Quick Start Commands

### Backend

```bash
# Enable Firebase in backend
export GOOGLE_IDENTITY_ENABLED=true
export GOOGLE_PROJECT_ID=cloud-secrets-manager
export GOOGLE_SERVICE_ACCOUNT_PATH=./infrastructure/gcp/keys/firebase-admin-key.json

# Run backend
cd apps/backend/secret-service
./mvnw spring-boot:run
```

### Frontend

```bash
# Create .env.local with Firebase config
cat > apps/frontend/.env.local << 'EOF'
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=cloud-secrets-manager.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloud-secrets-manager
VITE_FIREBASE_STORAGE_BUCKET=cloud-secrets-manager.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://localhost:8080
EOF

# Run frontend
cd apps/frontend
npm install
npm run dev
```

---

## API Endpoints

### Authentication
- POST `/api/auth/login` - Email/password login (returns JWT)
- POST `/api/auth/refresh` - Refresh JWT token
- POST `/api/auth/logout` - Logout (revoke tokens)

### Setup (Admin - disable in production)
- POST `/api/setup/user/roles` - Set user roles
- POST `/api/setup/user/permissions` - Set user permissions
- POST `/api/setup/user/both` - Set both roles and permissions

---

## Common User Management Tasks

### Grant Admin Role

```bash
# Get user UID from Firebase Console or after first login

# Using curl
curl -X POST http://localhost:8080/api/setup/user/roles \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "USER_FIREBASE_UID",
    "roles": ["ADMIN"]
  }'
```

### Grant Specific Permissions

```bash
curl -X POST http://localhost:8080/api/setup/user/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "USER_FIREBASE_UID",
    "permissions": ["SECRET_CREATE", "SECRET_READ", "SECRET_UPDATE", "SECRET_DELETE", "SECRET_SHARE"]
  }'
```

### Available Roles
- `USER` - Default role for all authenticated users
- `ADMIN` - Full access to all resources and admin endpoints

### Available Permissions
- `SECRET_CREATE` - Create new secrets
- `SECRET_READ` - Read secrets
- `SECRET_UPDATE` - Update existing secrets
- `SECRET_DELETE` - Delete secrets
- `SECRET_SHARE` - Share secrets with other users
- `SECRET_ROTATE` - Rotate secret values
- `AUDIT_READ` - Read audit logs
- `ADMIN_READ` - Read admin information
- `ADMIN_WRITE` - Modify admin settings

---

## Kubernetes Deployment

### Create Firebase Secret

```bash
kubectl create secret generic firebase-admin-key \
  --from-file=firebase-admin-key.json=infrastructure/gcp/keys/firebase-admin-key.json \
  --namespace=default
```

### Enable in Helm

Edit `values.yaml`:
```yaml
googleIdentity:
  enabled: true
  projectId: "cloud-secrets-manager"
```

Deploy:
```bash
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace default
```

---

## Testing

### Test Google Sign-In

1. Open frontend: http://localhost:5173
2. Click "Sign in with Google"
3. Select Google account
4. Should redirect to /secrets

### Test API with Firebase Token

```bash
# Get token from browser sessionStorage or console
TOKEN="your-firebase-id-token"

# Test authenticated endpoint
curl -X GET http://localhost:8080/api/v1/secrets \
  -H "Authorization: Bearer $TOKEN"
```

### Verify Token Claims

In browser console after signing in:
```javascript
const auth = firebase.auth();
const user = auth.currentUser;
user.getIdTokenResult().then(result => {
  console.log('Claims:', result.claims);
  console.log('Roles:', result.claims.roles);
  console.log('Permissions:', result.claims.permissions);
});
```

---

## Troubleshooting

### Backend won't start
```bash
# Check Firebase initialization
tail -f logs/secret-service.log | grep Firebase

# Expected: "Firebase Admin SDK initialized successfully"
```

### Google sign-in doesn't work
```bash
# Check Firebase console
# Go to Authentication → Sign-in method
# Ensure Google provider is ENABLED
```

### User has no permissions
```bash
# Set permissions via setup endpoint
# User MUST sign out and back in for changes to take effect
```

### Token validation fails
```bash
# Check backend logs
tail -f logs/secret-service.log | grep "Token validation"

# Verify Firebase is enabled
curl http://localhost:8080/actuator/env | jq '.propertySources[] | select(.name | contains("application.yml")) | .properties["google.cloud.identity.enabled"]'
```

---

## Migration from Local JWT to Firebase

### Backend
- Both authentication methods work simultaneously
- Firebase validation is attempted first
- Falls back to local JWT if Firebase validation fails
- No code changes needed to support both

### Frontend
- Detects Firebase configuration automatically
- If Firebase env vars present → Google OAuth enabled
- If Firebase env vars missing → Local auth only
- Users can use either authentication method

---

## Disabling Firebase

### Backend
```bash
export GOOGLE_IDENTITY_ENABLED=false
# Or in application.yml:
# google.cloud.identity.enabled: false
```

### Frontend
```bash
# Remove or comment out Firebase env vars in .env.local
# Google sign-in button will not appear
```

---

## Important Security Notes

1. Service account keys are in `.gitignore` - never commit them
2. Firebase config in frontend is safe to expose (API keys are public)
3. Custom claims require user re-authentication to take effect
4. Disable setup endpoint in production (`setup.enabled=false`)
5. Monitor Firebase Console for authentication activity

---

## Getting Help

- **Firebase Documentation**: https://firebase.google.com/docs/auth
- **Backend Logs**: `logs/secret-service.log`
- **Frontend Console**: Browser Developer Tools → Console tab
- **Kubernetes Logs**: `kubectl logs -f deployment/secret-service -n default`

