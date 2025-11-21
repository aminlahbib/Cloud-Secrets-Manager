# Google Cloud Identity Platform - Quick Reference

## Architecture Comparison

### Previous Setup (Removed - Traditional DB)
```
 This architecture has been removed. All authentication now uses Google Cloud Identity Platform.
```

### Current Setup (Google Cloud Identity Platform - Active)
```

 Client  

     
      Firebase SDK  Google Identity Platform
                         (Authentication + User Storage)
     
      POST /api/auth/login {idToken}
     

  AuthController     

     
     

 GoogleIdentityTokenValidator 

      Verify ID Token with Firebase Admin SDK
      Extract user info & roles from token claims
     

 Google Identity      
 Platform (Cloud)     
 - User data          
 - Roles (custom claims) 

     
     

 JWT Token        
 Generation       

```

**Key Difference:** No local user database - everything stored in Google Identity Platform

## Key Code Changes Summary

### Files to Create
1. `config/FirebaseConfig.java` - Initialize Firebase Admin SDK
2. `security/GoogleIdentityTokenValidator.java` - Validate Google ID tokens
3. `service/GoogleIdentityService.java` - Manage users in Google Identity Platform

### Files to Modify
1. `controller/AuthController.java` - Replace `/api/auth/login` with Google Identity endpoint
2. `config/SecurityConfig.java` - Remove traditional auth providers, simplify config
3. `pom.xml` - Add Firebase Admin SDK dependencies
4. `application.yml` - Add Google Cloud configuration

### Files Removed (No Longer Needed)
- `security/CustomUserDetailsService.java` - Removed (no local user DB)
- `entity/User.java` - Removed (users in Google Identity Platform)
- `repository/UserRepository.java` - Removed (no local user DB)
- `config/DataInitializer.java` - Removed (no local user initialization)
- Traditional login logic - Removed (replaced by Google Identity)

### Files to Keep
- `security/JwtTokenProvider.java` - Still generates JWT tokens for API calls
- `security/JwtAuthenticationFilter.java` - Still validates JWT tokens

## API Endpoints

### Primary Authentication Endpoint
```
POST /api/auth/login
Body: { "idToken": "google-id-token-from-firebase-sdk" }
Response: { "accessToken": "jwt-token", "tokenType": "Bearer", "expiresIn": 900 }
```

**Note:** This replaces the traditional username/password login. All authentication goes through Google Identity Platform.

## Configuration Properties

```yaml
google:
  cloud:
    identity:
      enabled: true  # Toggle feature on/off
      project-id: "your-gcp-project-id"
      api-key: "your-api-key"
      service-account-path: "/path/to/service-account.json"
      custom-claims-namespace: "https://yourdomain.com/claims"
```

## Maven Dependencies

```xml
<!-- Add these to pom.xml -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>
```

## Client-Side Flow

### JavaScript/TypeScript Example
```javascript
// 1. Initialize Firebase
import { getAuth, signInWithEmailAndPassword, getIdToken } from 'firebase/auth';

// 2. Sign in
const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// 3. Get ID token
const idToken = await getIdToken(userCredential.user);

// 4. Send to your backend
const response = await fetch('/api/auth/login/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});

// 5. Get your JWT token
const { accessToken } = await response.json();

// 6. Use for API calls
fetch('/api/secrets', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## Implementation Checklist

- [ ] Set up Google Cloud project
- [ ] Enable Identity Platform API
- [ ] Create service account and download JSON key
- [ ] Add Maven dependencies to `pom.xml`
- [ ] Add configuration properties to `application.yml`
- [ ] Implement `FirebaseConfig.java`
- [ ] Implement `GoogleIdentityTokenValidator.java`
- [ ] Implement `GoogleIdentityService.java`
- [ ] Update `AuthController.java` - replace login endpoint
- [ ] Update `SecurityConfig.java` - remove traditional auth
- [ ] Create test user in Google Identity Platform
- [ ] Set up custom claims (roles) for test user
- [ ] Test authentication flow
- [ ] Update frontend to use Firebase SDK
- [ ] Remove old authentication code (CustomUserDetailsService, etc.)
- [ ] Update documentation

## Cost Considerations

### Google Cloud Identity Platform Pricing
- **Free Tier**: 
  - 50,000 MAU (Monthly Active Users) free
  - Phone authentication: 10 verifications/month free
- **Paid Tier**:
  - $0.0055 per MAU after free tier
  - Phone authentication: $0.06 per verification

### Example
- 1,000 users/month: **FREE**
- 10,000 users/month: **FREE**
- 100,000 users/month: ~$275/month (50k free + 50k x $0.0055)

## Security Benefits

 **Password Management**: Google handles password hashing, reset, policies  
 **MFA Support**: Built-in multi-factor authentication  
 **Rate Limiting**: Protection against brute force attacks  
 **Email Verification**: Built-in email verification flow  
 **Account Lockout**: Automatic account protection  
 **Audit Logs**: Google provides authentication audit logs  
 **Compliance**: SOC 2, ISO 27001, GDPR compliant  

## Why Full Cloud Approach?

### Perfect For:
- Starting fresh (no existing users to migrate)
- Want to focus on core business logic
- Need social login (Google, Facebook, etc.)
- Want MFA support out of the box
- Need password reset flows
- Building SaaS product
- Need enterprise features
- Want simpler architecture

### Trade-offs:
- Less control over user data storage
- Requires internet connection
- Vendor lock-in (but migration possible)
- Custom claims limited to 1000 bytes

## Troubleshooting

### Common Issues

**Issue**: `FirebaseApp not initialized`
- **Solution**: Check service account JSON path and permissions

**Issue**: `Invalid ID token`
- **Solution**: Ensure token is fresh (tokens expire after 1 hour)

**Issue**: `User not found in database`
- **Solution**: Check `getOrCreateUser` logic in `GoogleIdentityTokenValidator`

**Issue**: `Roles not working`
- **Solution**: Set custom claims using `GoogleIdentityService.setUserRoles()`

## Next Steps After Integration

1. **Add Social Login**: Enable Google Sign-In, GitHub, etc.
2. **Implement MFA**: Enable multi-factor authentication
3. **Set Up Custom Claims**: Map roles to Google Identity Platform
4. **Migrate Users**: Gradually move existing users
5. **Update Frontend**: Use Firebase SDK for all auth flows
6. **Monitor Usage**: Track authentication metrics in Google Cloud Console

