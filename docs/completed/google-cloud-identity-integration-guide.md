 # Google Cloud Identity Platform Integration Guide

## Overview

This guide shows how to integrate **Google Cloud Identity Platform** (formerly Firebase Auth) into your Cloud Secrets Manager project. This will replace your current custom authentication with a managed cloud identity service.

## What is Google Cloud Identity Platform?

Google Cloud Identity Platform is Google's managed authentication service that provides:
- User authentication (email/password, social logins, phone)
- Multi-factor authentication (MFA)
- User management APIs
- OAuth 2.0 / OpenID Connect support
- Custom claims and roles
- Session management
- Password reset flows

## Architecture Changes

### Current Architecture (Traditional DB)
```
Client  AuthController  CustomUserDetailsService  PostgreSQL (users table)
                              
                         JWT Token Generation
```

### New Architecture (Google Cloud Identity - Full Cloud)
```
Client  Firebase SDK  Google Identity Platform (Authentication)
                              
                         Returns ID Token
                              
Client  AuthController  Validate ID Token with Firebase Admin SDK
                              
                         Extract User Info & Roles from Token Claims
                              
                         Generate Custom JWT (or use Google ID token directly)
                              
                         Client uses JWT for API calls
```

**Key Points:**
- No local user database required
- All user data stored in Google Identity Platform
- Roles stored as custom claims in ID tokens
- Simpler, cloud-native architecture

## Integration Approach

**This guide implements Option 2: Full Cloud Approach**

- Use Google Identity Platform exclusively for authentication
- Store custom claims (roles) directly in Google Identity Platform
- No local user database needed for authentication
- All user data managed by Google Cloud Identity Platform
- Simpler architecture, perfect for starting fresh

---

## Step 1: Google Cloud Setup

### 1.1 Enable Identity Platform API

```bash
# Install Google Cloud SDK if not already installed
# Then enable the API:
gcloud services enable identitytoolkit.googleapis.com
```

### 1.2 Create Identity Platform Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Identity Platform**  **Get Started**
3. Enable Identity Platform for your project
4. Configure authentication methods:
   - Email/Password: Enable
   - Google Sign-In: Enable (optional)
   - Other providers: As needed

### 1.3 Get Credentials

1. Go to **APIs & Services**  **Credentials**
2. Create a **Service Account** for backend operations
3. Download the JSON key file
4. Note your **Project ID** and **API Key**

---

## Step 2: Maven Dependencies

Add to `secret-service/pom.xml`:

```xml
<!-- Google Cloud Identity Platform -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>

<!-- Google OAuth Client (for token validation) -->
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>

<!-- Google API Client -->
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
```

---

## Step 3: Configuration

### 3.1 Application Properties

Add to `secret-service/src/main/resources/application.yml`:

```yaml
google:
  cloud:
    identity:
      enabled: ${GOOGLE_IDENTITY_ENABLED:false}
      project-id: ${GOOGLE_PROJECT_ID:your-project-id}
      api-key: ${GOOGLE_API_KEY:your-api-key}
      service-account-path: ${GOOGLE_SERVICE_ACCOUNT_PATH:classpath:service-account.json}
      # Optional: Custom claims namespace for roles
      custom-claims-namespace: ${GOOGLE_CUSTOM_CLAIMS_NAMESPACE:https://yourdomain.com/claims}
```

### 3.2 Environment Variables (for Docker/K8s)

```yaml
# In docker-compose.yml or K8s secrets
GOOGLE_IDENTITY_ENABLED: "true"
GOOGLE_PROJECT_ID: "your-gcp-project-id"
GOOGLE_API_KEY: "your-api-key"
GOOGLE_SERVICE_ACCOUNT_PATH: "/path/to/service-account.json"
```

---

## Step 4: Code Implementation

### 4.1 Firebase Admin Configuration

**New File:** `secret-service/src/main/java/com/secrets/config/FirebaseConfig.java`

```java
package com.secrets.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${google.cloud.identity.enabled:false}")
    private boolean enabled;

    @Value("${google.cloud.identity.project-id}")
    private String projectId;

    @Value("${google.cloud.identity.service-account-path}")
    private String serviceAccountPath;

    @PostConstruct
    public void initialize() {
        if (!enabled) {
            log.info("Google Cloud Identity Platform is disabled");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = getServiceAccountInputStream();
                
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId(projectId)
                    .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase Admin SDK", e);
            throw new RuntimeException("Firebase initialization failed", e);
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        if (!enabled) {
            return null;
        }
        return FirebaseAuth.getInstance();
    }

    private InputStream getServiceAccountInputStream() throws IOException {
        // Try as file path first (for Docker/K8s)
        try {
            return new FileInputStream(serviceAccountPath);
        } catch (Exception e) {
            // Fall back to classpath (for local dev)
            return getClass().getClassLoader()
                .getResourceAsStream(serviceAccountPath.replace("classpath:", ""));
        }
    }
}
```

### 4.2 Google Identity Token Validator

**New File:** `secret-service/src/main/java/com/secrets/security/GoogleIdentityTokenValidator.java`

```java
package com.secrets.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class GoogleIdentityTokenValidator {

    private final FirebaseAuth firebaseAuth;
    
    @Value("${google.cloud.identity.enabled:false}")
    private boolean enabled;

    /**
     * Validates a Google ID token and returns authentication
     * All user data comes from Google Identity Platform - no local database needed
     */
    public Authentication validateToken(String idToken) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Identity Platform is not enabled");
        }

        // Verify the ID token with Google Identity Platform
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String name = decodedToken.getName();
        
        log.debug("Validated Google ID token for user: {} ({})", email, uid);

        // Extract roles from custom claims in the token
        // Roles are stored as custom claims in Google Identity Platform
        Collection<? extends GrantedAuthority> authorities = extractAuthorities(decodedToken);

        // Create authentication object using email as username
        // No password needed - authentication already verified by Google
        org.springframework.security.core.userdetails.User principal = 
            new org.springframework.security.core.userdetails.User(
                email, // Use email as username
                "", // No password needed
                authorities
            );

        return new UsernamePasswordAuthenticationToken(
            principal,
            idToken,
            authorities
        );
    }

    /**
     * Extract roles from custom claims in the Firebase token
     * Custom claims are set via Admin SDK (see GoogleIdentityService)
     */
    private Collection<? extends GrantedAuthority> extractAuthorities(FirebaseToken token) {
        List<String> roles = extractRolesFromToken(token);
        
        // Default to USER role if no roles specified
        if (roles.isEmpty()) {
            roles = List.of("USER");
            log.debug("No roles found in token, defaulting to USER role");
        }

        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toList());
    }

    /**
     * Extract roles from custom claims
     * Custom claims are stored in the token when set via Admin SDK
     */
    @SuppressWarnings("unchecked")
    private List<String> extractRolesFromToken(FirebaseToken token) {
        Object rolesClaim = token.getClaims().get("roles");
        
        if (rolesClaim instanceof List) {
            return (List<String>) rolesClaim;
        }
        
        // Also check for single role string
        if (rolesClaim instanceof String) {
            return List.of((String) rolesClaim);
        }
        
        return List.of();
    }
}
```

### 4.3 Modified AuthController

**Modified:** `secret-service/src/main/java/com/secrets/controller/AuthController.java`

```java
package com.secrets.controller;

import com.secrets.dto.TokenResponse;
import com.secrets.security.GoogleIdentityTokenValidator;
import com.secrets.security.JwtTokenProvider;
import com.google.firebase.auth.FirebaseAuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final GoogleIdentityTokenValidator googleTokenValidator;

    @Value("${security.jwt.expiration-ms:900000}")
    private long expirationMs;

    @Value("${google.cloud.identity.enabled:false}")
    private boolean googleIdentityEnabled;

    /**
     * Google Identity Platform login (ID token)
     * This is the primary authentication endpoint - all authentication goes through Google
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody GoogleLoginRequest request) {
        if (!googleIdentityEnabled) {
            return ResponseEntity.badRequest()
                .body(TokenResponse.builder()
                    .error("Google Identity Platform is not enabled")
                    .build());
        }

        try {
            log.debug("Google Identity login attempt with ID token");
            
            // Validate Google ID token with Firebase Admin SDK
            Authentication authentication = googleTokenValidator.validateToken(request.getIdToken());

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Generate your own JWT token for API calls
            // You could also use the Google ID token directly, but generating your own
            // gives you more control over expiration and claims
            String token = tokenProvider.generateToken(
                userDetails.getUsername(),
                userDetails.getAuthorities()
            );

            TokenResponse response = TokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .build();

            log.info("User {} logged in successfully via Google Identity Platform", userDetails.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (FirebaseAuthException e) {
            log.error("Failed to validate Google ID token", e);
            return ResponseEntity.status(401)
                .body(TokenResponse.builder()
                    .error("Invalid ID token: " + e.getMessage())
                    .build());
        }
    }

    // DTO for Google login
    public static class GoogleLoginRequest {
        private String idToken;

        public String getIdToken() {
            return idToken;
        }

        public void setIdToken(String idToken) {
            this.idToken = idToken;
        }
    }
}
```

### 4.4 Modified SecurityConfig

**Modified:** `secret-service/src/main/java/com/secrets/config/SecurityConfig.java`

```java
package com.secrets.config;

import com.secrets.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Login endpoint
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            // No need for DaoAuthenticationProvider - authentication handled by Google
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

**Note:** Since we're using Google Identity Platform exclusively, we no longer need:
- `DaoAuthenticationProvider`
- `UserDetailsService` for authentication
- `PasswordEncoder`
- `AuthenticationManager` for username/password auth

All authentication is handled by validating Google ID tokens.

---

## Step 5: Client-Side Integration

### 5.1 Frontend (JavaScript/TypeScript)

```javascript
// Install Firebase SDK
// npm install firebase

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getIdToken
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login with email/password
async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await getIdToken(userCredential.user);
  
  // Send ID token to your backend
  const response = await fetch('http://localhost:8080/api/auth/login/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  
  const { accessToken } = await response.json();
  // Use accessToken for subsequent API calls
}

// Login with Google
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const idToken = await getIdToken(userCredential.user);
  
  // Send ID token to your backend
  const response = await fetch('http://localhost:8080/api/auth/login/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  
  const { accessToken } = await response.json();
  // Use accessToken for subsequent API calls
}
```

---

## Step 6: Setting Custom Claims (Roles)

To set roles in Google Identity Platform, use the Admin SDK:

**New File:** `secret-service/src/main/java/com/secrets/service/GoogleIdentityService.java`

```java
package com.secrets.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleIdentityService {

    private final FirebaseAuth firebaseAuth;

    /**
     * Set custom claims (roles) for a user in Google Identity Platform
     */
    public void setUserRoles(String uid, List<String> roles) throws FirebaseAuthException {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);
        
        firebaseAuth.setCustomUserClaims(uid, claims);
        log.info("Set roles {} for user {}", roles, uid);
    }

    /**
     * Get user from Google Identity Platform
     */
    public UserRecord getUserByUid(String uid) throws FirebaseAuthException {
        return firebaseAuth.getUser(uid);
    }

    /**
     * Create user in Google Identity Platform
     */
    public UserRecord createUser(String email, String password) throws FirebaseAuthException {
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
            .setEmail(email)
            .setPassword(password)
            .setEmailVerified(false);

        UserRecord userRecord = firebaseAuth.createUser(request);
        log.info("Created user in Google Identity Platform: {}", email);
        return userRecord;
    }
}
```

---

## Authentication Flow

### Google Identity Platform Login Flow (Full Cloud)
```
1. Client  Firebase SDK  Sign in with Email/Password or Google
2. Firebase  Authenticates user with Google Identity Platform
3. Firebase  Returns ID Token (contains user info + custom claims/roles)
4. Client  POST /api/auth/login {idToken}
5. Backend  Validate ID Token with Firebase Admin SDK
6. Backend  Extract user info and roles from token claims
7. Backend  Generate JWT token (or use Google ID token directly)
8. Client  Use JWT for subsequent API calls
9. Backend  Validate JWT on each request
```

**Key Points:**
- No database queries for authentication
- All user data comes from the ID token
- Roles stored as custom claims in Google Identity Platform
- Stateless authentication - no session storage needed

---

## User Management

Since you're starting fresh with the Full Cloud approach, all user management happens through Google Identity Platform:

### Creating Users

Users can be created in two ways:

1. **Self-Registration** (via Firebase SDK on frontend):
   ```javascript
   import { createUserWithEmailAndPassword } from 'firebase/auth';
   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
   ```

2. **Admin Creation** (via Admin SDK on backend):
   ```java
   // Use GoogleIdentityService.createUser() method
   UserRecord user = googleIdentityService.createUser("user@example.com", "password123");
   ```

### Setting User Roles

Roles are stored as custom claims in Google Identity Platform:

```java
// Set roles for a user
googleIdentityService.setUserRoles(uid, List.of("ADMIN", "USER"));
```

The roles will be included in the ID token on next login.

### User Data Storage

- **Authentication data**: Stored in Google Identity Platform
- **Application-specific data**: If you need to store additional user data (preferences, settings, etc.), you can still use your PostgreSQL database, but link it by email or UID from Google Identity Platform

---

## Benefits of This Integration

1. **Managed Service**: No need to handle password reset, email verification, etc.
2. **Security**: Google handles security best practices
3. **Social Login**: Easy to add Google, Facebook, GitHub sign-in
4. **MFA**: Built-in multi-factor authentication support
5. **Scalability**: Auto-scales with your user base
6. **Compliance**: Google handles compliance requirements

## Considerations

1. **Cost**: Google Identity Platform has a free tier (50,000 MAU), then pay-per-use (~$0.0055 per MAU)
2. **Vendor Lock-in**: You're tied to Google's service, but migration is possible if needed
3. **Internet Dependency**: Requires internet connection to validate tokens
4. **Latency**: Token validation adds minimal latency (~50-100ms)
5. **No Local User DB**: All user authentication data is in the cloud - simpler but less control
6. **Custom Claims Limit**: Custom claims are limited to 1000 bytes per user
7. **Token Expiration**: ID tokens expire after 1 hour - clients need to refresh

## Advantages of Full Cloud Approach

 **Simpler Architecture**: No user database to manage  
 **Faster Development**: No need to build user management features  
 **Built-in Features**: Password reset, email verification, MFA out of the box  
 **Scalability**: Auto-scales with Google's infrastructure  
 **Security**: Google handles security best practices  
 **Social Login**: Easy to add Google, Facebook, GitHub, etc.  
 **Less Code**: Fewer components to maintain

---

## Testing

### Test Google Identity Login

**Step 1:** Get an ID token from Firebase (using Firebase SDK in your frontend or test script)

**Step 2:** Call your login endpoint:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your-google-id-token-here"}'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Step 3:** Use the access token for API calls:
```bash
curl -X GET http://localhost:8080/api/secrets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Testing with Firebase Admin SDK (Backend Testing)

You can also create test users programmatically:

```java
@Autowired
private GoogleIdentityService googleIdentityService;

@Test
void testUserCreation() throws FirebaseAuthException {
    // Create user
    UserRecord user = googleIdentityService.createUser("test@example.com", "password123");
    
    // Set roles
    googleIdentityService.setUserRoles(user.getUid(), List.of("ADMIN"));
    
    // Get user
    UserRecord retrieved = googleIdentityService.getUserByUid(user.getUid());
    assertNotNull(retrieved);
}
```

---

## Next Steps

1. **Set up Google Cloud project** and enable Identity Platform
2. **Add Maven dependencies** to `pom.xml`
3. **Add configuration** to `application.yml`
4. **Implement the code**:
   - `FirebaseConfig.java`
   - `GoogleIdentityTokenValidator.java`
   - `GoogleIdentityService.java`
   - Update `AuthController.java`
   - Update `SecurityConfig.java`
5. **Create a test user** in Google Identity Platform (via console or Admin SDK)
6. **Set roles** for the test user using `GoogleIdentityService.setUserRoles()`
7. **Test authentication** with the Firebase SDK on frontend
8. **Update frontend** to use Firebase SDK for all authentication flows
9. **Remove old authentication code** (if any):
   - `CustomUserDetailsService` (no longer needed)
   - Traditional login endpoint (replaced)
   - User entity password fields (optional cleanup)

---

## Resources

- [Google Cloud Identity Platform Docs](https://cloud.google.com/identity-platform/docs)
- [Firebase Admin SDK for Java](https://firebase.google.com/docs/admin/setup)
- [Firebase Auth Web SDK](https://firebase.google.com/docs/auth/web/start)

