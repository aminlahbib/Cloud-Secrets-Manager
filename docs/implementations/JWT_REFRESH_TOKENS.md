# JWT Refresh Tokens Implementation 

## **Summary**

JWT refresh token mechanism has been successfully implemented! Users can now refresh their access tokens without re-authenticating.

---

## ** What Was Implemented**

### **1. Database Entity**
- **`RefreshToken`** entity with:
  - Token string (unique)
  - Username
  - Expiration date
  - Revocation flag
  - Created timestamp
  - Indexes for performance

### **2. Repository**
- **`RefreshTokenRepository`** with methods for:
  - Finding tokens
  - Deleting expired tokens
  - Revoking tokens (single or all for a user)

### **3. Service Layer**
- **`RefreshTokenService`** with:
  - Token creation (with automatic revocation of old tokens - token rotation)
  - Token validation
  - Expiration verification
  - Token revocation
  - New access token generation

### **4. API Endpoints**
- **`POST /api/auth/login`** - Now returns both access token and refresh token
- **`POST /api/auth/refresh`** - New endpoint to refresh access tokens

### **5. DTOs**
- **`TokenResponse`** - Updated to include `refreshToken` field
- **`RefreshTokenRequest`** - Request DTO for refresh endpoint

### **6. Exception Handling**
- **`TokenRefreshException`** - Custom exception for refresh token errors
- Added handler in `GlobalExceptionHandler`

---

## ** Configuration**

### **Application Properties**
```yaml
security:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: 900000  # 15 minutes (access token)
    refresh-expiration-ms: 604800000  # 7 days (refresh token)
```

---

## ** API Usage**

### **1. Login (Get Tokens)**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "idToken": "google-id-token-here"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

### **2. Refresh Access Token**
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Note:** Refresh tokens are rotated (new refresh token issued on each refresh) for security.

---

## ** Security Features**

1. **Token Rotation**: Old refresh tokens are revoked when new ones are issued
2. **Expiration Management**: Refresh tokens expire after 7 days (configurable)
3. **Revocation Support**: Tokens can be revoked individually or all at once for a user
4. **Database Storage**: Refresh tokens are stored in database for revocation control
5. **Automatic Cleanup**: Expired tokens can be cleaned up periodically

---

## ** Database Schema**

```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    INDEX idx_token (token),
    INDEX idx_username (username),
    INDEX idx_expires_at (expires_at)
);
```

---

## ** Files Created/Modified**

### **New Files**
1. `src/main/java/com/secrets/entity/RefreshToken.java`
2. `src/main/java/com/secrets/repository/RefreshTokenRepository.java`
3. `src/main/java/com/secrets/service/RefreshTokenService.java`
4. `src/main/java/com/secrets/exception/TokenRefreshException.java`
5. `src/main/java/com/secrets/dto/RefreshTokenRequest.java`

### **Modified Files**
1. `src/main/java/com/secrets/controller/AuthController.java`
2. `src/main/java/com/secrets/dto/TokenResponse.java`
3. `src/main/java/com/secrets/security/JwtTokenProvider.java`
4. `src/main/java/com/secrets/exception/GlobalExceptionHandler.java`

---

## ** Status**

- **Implementation**:  Complete
- **Testing**:  Complete (15 new tests)
- **Postman Collection**:  Updated
- **Documentation**:  Complete

---

**Status**:  **COMPLETE** - JWT refresh tokens fully implemented and tested!

