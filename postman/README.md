# Postman Collection for Cloud Secrets Manager 🚀

Complete Postman collection with full test suite for the Cloud Secrets Manager API.

---

## 📁 **Files**

- **`Cloud-Secrets-Manager.postman_collection.json`** - Complete API collection with test scripts
- **`Cloud-Secrets-Manager.postman_environment.json`** - Environment variables for local development

---

## 🚀 **Quick Start**

### **1. Import into Postman**

1. Open Postman
2. Click **"Import"** button
3. Select both files:
   - `Cloud-Secrets-Manager.postman_collection.json`
   - `Cloud-Secrets-Manager.postman_environment.json`
4. Select the environment: **"Cloud Secrets Manager - Local"**

### **2. Start the Application**

```bash
source set-java-21.sh
cd secret-service
./mvnw spring-boot:run
```

### **3. Get Google ID Token**

You need a Google ID token to authenticate. Use Firebase SDK:

```javascript
// In browser console or Firebase SDK
import { getAuth, signInWithEmailAndPassword, getIdToken } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(
  auth, 
  "your-email@gmail.com", 
  "your-password"
);
const idToken = await getIdToken(userCredential.user);
console.log("ID Token:", idToken);
```

Then set `google_id_token` in Postman environment variables.

### **4. Test Authentication**

1. Go to **"Authentication"** → **"Login with Google ID Token"**
2. Click **"Send"**
3. JWT token will be automatically saved to environment

### **5. Run Full Test Suite**

1. Click on collection name
2. Click **"Run"** button
3. Select all requests
4. Click **"Run Cloud Secrets Manager API"**
5. Watch all tests execute with assertions

---

## 📋 **Collection Structure**

### **Setup** (No Authentication Required)
- ✅ Create Admin User
- ✅ Create Test User

### **Authentication**
- ✅ Login with Google ID Token

### **Admin** (Requires ADMIN Role)
- ✅ Create User
- ✅ Set User Roles
- ✅ Set User Permissions
- ✅ Get User by Email

### **Secrets** (Requires Authentication)
- ✅ Create Secret
- ✅ Get Secret by Key
- ✅ Update Secret
- ✅ Delete Secret
- ✅ Get Secret Versions
- ✅ Get Specific Secret Version
- ✅ Rollback Secret to Version

### **Health** (Public)
- ✅ Health Check
- ✅ Info

---

## 🔧 **Environment Variables**

The collection uses these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:8080` |
| `jwt_token` | JWT access token | Auto-saved after login |
| `google_id_token` | Google ID token | From Firebase SDK |
| `admin_uid` | Admin user UID | Auto-saved after admin creation |
| `admin_email` | Admin email | `admin@example.com` |
| `user_uid` | User UID | Set manually |
| `user_email` | User email | `user@example.com` |
| `secret_id` | Secret ID | Auto-saved after secret creation |

---

## 🎯 **Testing Workflow**

### **Initial Setup:**

1. **Create Admin User**
   - Run: `Setup → Create Admin User`
   - Admin UID and email saved automatically

2. **Get Google ID Token**
   - Use Firebase SDK or Google Sign-In
   - Set `google_id_token` in environment

3. **Login**
   - Run: `Authentication → Login with Google ID Token`
   - JWT token saved automatically

### **User Management:**

4. **Create Users**
   - Run: `Admin → Create User`
   - Requires JWT token (from step 3)

5. **Set Roles**
   - Run: `Admin → Set User Roles`
   - Update `user_uid` variable first

### **Secret Management:**

6. **Create Secret**
   - Run: `Secrets → Create Secret`
   - Secret ID saved automatically

7. **Get/Update/Delete Secrets**
   - Use saved `secret_id` variable

---

## 🔐 **Authentication**

### **Bearer Token Authentication**

Most endpoints require a JWT token. The collection automatically:
- Saves JWT token after login
- Adds token to Authorization header
- Validates responses with test scripts

### **Getting Google ID Token**

Use Firebase SDK to get an ID token, then set it in Postman environment variable `google_id_token`.

---

## 📝 **Example Requests**

### **Create Admin User**

```json
POST http://localhost:8080/api/setup/create-admin
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "Admin123!@#"
}
```

### **Login**

```json
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

### **Create Secret**

```json
POST http://localhost:8080/api/secrets
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "key": "database_password",
    "value": "MySecurePassword123!@#"
}
```

---

## 🐛 **Troubleshooting**

### **401 Unauthorized**
- Check if JWT token is set in environment
- Verify token hasn't expired (15 minutes)
- Re-authenticate to get new token

### **403 Forbidden**
- Check if user has required role (ADMIN for admin endpoints)
- Verify roles are set in Google Identity Platform
- User must re-authenticate after role changes

### **404 Not Found**
- Verify `base_url` is correct
- Check if application is running
- Verify endpoint path is correct

### **500 Internal Server Error**
- Check application logs
- Verify Google Identity Platform is configured
- Check service account file is accessible

---

## 🎯 **Test Features**

- **Full Test Suite**: All endpoints with assertions
- **Auto-Save Variables**: JWT tokens, IDs automatically saved
- **Error Handling**: Tests for error scenarios
- **Response Validation**: Status codes, structure, data validation
- **Response Time Checks**: Performance validation


