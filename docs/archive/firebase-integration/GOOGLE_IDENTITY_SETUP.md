# Google Cloud Identity Platform Setup Guide 

This guide will help you set up Google Cloud Identity Platform for the Cloud Secrets Manager.

---

## Prerequisites

- Google Cloud account
- Google Cloud project (or create a new one)
- Basic knowledge of Google Cloud Console

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"**  **"New Project"**
3. Enter project name: `cloud-secrets-manager` (or your preferred name)
4. Click **"Create"**
5. Wait for project creation (takes a few seconds)

---

## Step 2: Enable Identity Platform API

### Important: Use the Correct API

**You need:** Identity Platform API (NOT Identity-Aware Proxy API)

- **Identity Platform API** - For user authentication (what you need)
- **Cloud Identity-Aware Proxy API** - For access control (different service)

### Enable via Google Cloud Console:

1. In Google Cloud Console, go to **"APIs & Services"**  **"Library"**
2. Search for **"Identity Platform API"** (make sure it says "Identity Platform", not "Identity-Aware Proxy")
3. You should see:
   - **Name**: Identity Platform API
   - **Description**: "Enables authentication and user management for your applications"
   - **API**: `identitytoolkit.googleapis.com`
4. Click on it and click **"Enable"**
5. Wait for API to be enabled

**Direct link:** https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com

**Or use gcloud CLI:**
```bash
gcloud services enable identitytoolkit.googleapis.com
```

### Verify it's enabled:

1. Go to **"APIs & Services"**  **"Enabled APIs"**
2. You should see **"Identity Platform API"** in the list
3. The API name should be `identitytoolkit.googleapis.com`

---

## Step 3: Configure Identity Platform

1. Go to **"Identity Platform"** in the left menu
2. Click **"Get Started"** (if first time)
3. Enable authentication methods:
   - **Email/Password**: Enable
   - **Google Sign-In**: Enable (optional but recommended)
   - Other providers as needed

---

## Step 4: Create Service Account

1. Go to **"IAM & Admin"**  **"Service Accounts"**
2. Click **"Create Service Account"**
3. Enter details:
   - **Name**: `secrets-manager-backend`
   - **Description**: `Service account for Cloud Secrets Manager backend`
4. Click **"Create and Continue"**
5. Grant role: **"Firebase Admin SDK Administrator Service Agent"**
6. Click **"Continue"**  **"Done"**

---

## Step 5: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"**  **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. **IMPORTANT**: Save the downloaded JSON file securely
   - Recommended location: `apps/backend/secret-service/src/main/resources/service-account.json` (for local dev)
   - **DO NOT commit this file to Git!** Add it to `.gitignore`

---

## Step 6: Get Project ID and API Key

### Get Project ID:
1. In Google Cloud Console, go to **"Home"** (dashboard)
2. Your **Project ID** is displayed at the top
   - Example: `cloud-secrets-manager-123456`

### Get API Key:
1. Go to **"APIs & Services"**  **"Credentials"**
2. Under **"API Keys"**, click **"Create Credentials"**  **"API Key"**
3. Copy the API key
4. (Optional) Click **"Restrict Key"** for security:
   - Application restrictions: **HTTP referrers**
   - API restrictions: **Identity Platform API**

---

## Step 7: Configure Application

### Option A: Local Development

1. Place service account JSON file at:
   ```
   apps/backend/secret-service/src/main/resources/service-account.json
   ```

2. Update `application.yml` or create `.env` file:
   ```yaml
   google:
     cloud:
       identity:
         enabled: true
         project-id: your-project-id
         api-key: your-api-key
         service-account-path: classpath:service-account.json
   ```

### Option B: Docker/Docker Compose

1. Place service account JSON file in project root or secure location
2. Update `docker-compose.yml` environment variables:
   ```yaml
   environment:
     GOOGLE_IDENTITY_ENABLED: "true"
     GOOGLE_PROJECT_ID: "your-project-id"
     GOOGLE_API_KEY: "your-api-key"
     GOOGLE_SERVICE_ACCOUNT_PATH: "/app/service-account.json"
   volumes:
     - ./service-account.json:/app/service-account.json:ro
   ```

### Option C: Kubernetes

1. Create Kubernetes Secret:
   ```bash
   kubectl create secret generic google-service-account \
     --from-file=service-account.json=/path/to/service-account.json
   ```

2. Mount in deployment:
   ```yaml
   volumes:
     - name: service-account
       secret:
         secretName: google-service-account
   volumeMounts:
     - name: service-account
       mountPath: /app/service-account.json
       subPath: service-account.json
   ```

---

## Step 8: Create Test User

### **Quick Method: Use Setup Endpoint** (Recommended)

**Fastest way to create your first admin user:**

1. **Start the application:**
   ```bash
   source scripts/dev/set-java-21.sh
   cd secret-service
   ./mvnw spring-boot:run
   ```

2. **Create admin user:**
   ```bash
   curl -X POST http://localhost:8080/api/setup/create-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "Admin123!@#"
     }'
   ```

3. **Disable setup endpoint** (for security):
   ```bash
   # Add to .env file:
   SETUP_ENABLED=false
   ```

**See:** `docs/STEP_8_QUICK_START.md` for detailed instructions.

---

### Option A: Using Google Cloud Console

1. Go to **"Identity Platform"**  **"Users"**
2. Click **"Add user"**
3. Enter:
   - **Email**: `test@example.com`
   - **Password**: (set a secure password)
4. Click **"Add user"**

**Note:** You'll need to set roles programmatically after creating the user.

---

### Option B: Using Admin API (After Setup)

Once you have an admin user, use the Admin API to create users in Google Identity Platform:

```bash
# Create user via Google Identity Platform (uses SetupController)
curl -X POST http://localhost:8080/api/setup/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "User123!@#",
    "roles": ["USER"]
  }'
```

**Note:** All users are created in Google Cloud Identity Platform, not in a local database.

---

## Step 9: Set User Roles (Custom Claims)

Roles are stored as custom claims in Google Identity Platform.

### Using Admin SDK:

```java
@Autowired
private GoogleIdentityService googleIdentityService;

// Set roles for a user
googleIdentityService.setUserRoles(
    "user-uid-here",
    List.of("USER", "ADMIN")
);
```

**Important**: After setting custom claims, the user must **re-authenticate** for the new roles to appear in their ID token.

---

## Step 10: Test Authentication

### Frontend (JavaScript/TypeScript)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, getIdToken } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login
const userCredential = await signInWithEmailAndPassword(
  auth, 
  "test@example.com", 
  "password"
);

// Get ID token
const idToken = await getIdToken(userCredential.user);

// Send to backend
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});

const { accessToken } = await response.json();
console.log('JWT Token:', accessToken);
```

### Backend (curl)

```bash
# First, get ID token from Firebase SDK (frontend)
# Then use it to login:

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9..."
  }'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

---

## Step 11: Verify Setup

1. **Check logs**: Application should log:
   ```
   Firebase Admin SDK initialized successfully for project: your-project-id
   ```

2. **Test login**: Try logging in with a test user

3. **Check JWT token**: Decode the JWT token and verify it contains:
   - Username (email)
   - Roles
   - Expiration

---

## Troubleshooting

### Issue: "Firebase not initialized"

**Solution**: 
- Check service account JSON path is correct
- Verify service account has correct permissions
- Check project ID is correct

### Issue: "Invalid ID token"

**Solution**:
- Ensure ID token is fresh (tokens expire after 1 hour)
- Verify API key is correct
- Check authentication method is enabled in Identity Platform

### Issue: "User not found"

**Solution**:
- Create user in Google Cloud Console first
- Or use `GoogleIdentityService.createUser()`

### Issue: "Roles not working"

**Solution**:
- Set custom claims using `GoogleIdentityService.setUserRoles()`
- User must re-authenticate after setting claims
- Check roles are in format: `["USER", "ADMIN"]`

---

## Security Best Practices

1. **Never commit service account JSON to Git**
   - Add to `.gitignore`
   - Use environment variables or secrets management

2. **Restrict API Key**
   - Limit to specific APIs
   - Add HTTP referrer restrictions

3. **Use least privilege**
   - Service account only needs Firebase Admin permissions

4. **Rotate keys regularly**
   - Regenerate service account keys periodically
   - Update API keys if compromised

5. **Monitor usage**
   - Check Google Cloud Console for unusual activity
   - Set up alerts for authentication failures

---

## Next Steps

1. Set up Google Cloud project
2. Enable Identity Platform
3. Create service account
4. Configure application
5. Create test users
6. Set user roles
7. Test authentication
8. **Deploy to production**
9. **Set up MFA** (recommended)
10.  **Configure social login** (optional)

---

## Additional Resources

- [Google Cloud Identity Platform Docs](https://cloud.google.com/identity-platform/docs)
- [Firebase Admin SDK for Java](https://firebase.google.com/docs/admin/setup)
- [Firebase Auth Web SDK](https://firebase.google.com/docs/auth/web/start)
- [Custom Claims Guide](https://firebase.google.com/docs/auth/admin/custom-claims)

---

## Support

If you encounter issues:
1. Check application logs
2. Verify Google Cloud Console configuration
3. Review this guide
4. Check Google Cloud Identity Platform documentation

