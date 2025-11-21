# Hybrid User Registry Architecture 

This document explains how the system would work with **BOTH** local user database and Google Cloud Identity Platform user registry simultaneously.

---

## Overview

A **hybrid approach** allows users to authenticate using either:
1. **Local Database** - Traditional username/password (PostgreSQL)
2. **Google Cloud Identity Platform** - Google ID tokens (cloud user registry)

This provides flexibility and gradual migration path.

---

## Architecture Diagram

### Hybrid Architecture (Both Methods)

```

                    YOU (The User)                        
              (curl, Postman, Web App)                    

                        
                         HTTP Requests
                        
        
                                       
                                       
          
  Secret Service              Audit Service   
   (Port 8080)                 (Port 8081)    
                                              
 - Stores secrets            - Logs events    
 - Encrypts data   - Tracks access  
 - Controls access  REST     - Compliance     
                                              
                              
  Auth Router                               
  (Hybrid)                                  
                              
                                             
                                   
                                            
                                            
                              
 Local  Google                            
 Auth   Auth                              
                              
                                            
          
                                     
                                     
                                     
  
 Users     Google Cloud         Audit DB   
   DB      Identity Platform   (PostgreSQL)
                                           
 - Users   - User data        - Audit logs 
 - Roles   - Roles (claims)   - Timestamps 
 - Pass    - MFA, Social                   
   hash      login, etc.                   
  
     
     
     

   Secrets DB     
  (PostgreSQL)    
                  
 - Encrypted      
   secrets        
 - created_by     
   (email/uid)    

```

---

## Authentication Flow

### Flow 1: Local Database Authentication

```

 Client  

     
      POST /api/auth/login
      { "username": "alice", "password": "secret123" }
     
     

  AuthController     
  /api/auth/login    

     
      Detect: username/password format
     
     

 AuthenticationRouter     
 (Hybrid Auth Handler)    

     
      Route to: Local Authentication
     
     

 LocalAuthService         
                          
 1. Query PostgreSQL      
    users table           
 2. Check password hash   
    (BCrypt)              
 3. Load user roles       

     
      User authenticated
     
     

 JwtTokenProvider         
                          
 Generate JWT with:       
 - username               
 - roles                  
 - authSource: "local"    

     
      Return JWT token
     
     

 Client  
 (JWT)   

```

### Flow 2: Google Cloud Identity Platform Authentication

```

 Client  

     
      1. Authenticate with Firebase SDK
         (email/password, Google Sign-In, etc.)
     
      2. Get Google ID token from Firebase
     
      3. POST /api/auth/login/google
         { "idToken": "eyJhbGciOiJSUzI1NiIs..." }
     
     

  AuthController     
  /api/auth/login/   
  google             

     
      Detect: idToken format
     
     

 AuthenticationRouter     
 (Hybrid Auth Handler)    

     
      Route to: Google Authentication
     
     

 GoogleAuthService        
                          
 1. Validate ID token     
    with Firebase Admin   
 2. Extract user info     
    (email, uid, name)    
 3. Extract roles from    
    custom claims         

     
      User authenticated
     
     

 JwtTokenProvider         
                          
 Generate JWT with:       
 - email (as username)    
 - roles (from claims)    
 - authSource: "google"   
 - googleUid              

     
      Return JWT token
     
     

 Client  
 (JWT)   

```

### Flow 3: Unified Login Endpoint (Auto-Detect)

```

 Client  

     
      POST /api/auth/login
     
      Option A: { "username": "...", "password": "..." }
      Option B: { "idToken": "..." }
     
     

  AuthController     
  /api/auth/login    
  (Unified)          

     
      Detect request type
     
     
                                       
                                       
        
 Has           Has           Invalid  
 username      idToken       Request  
 &                                    
 password                             
        
                                   
                                   
                                   
        
 Local         Google        Error    
 Auth          Auth          400      
        
```

---

## Code Structure

### New/Modified Files

```
secret-service/src/main/java/com/secrets/
 controller/
    AuthController.java              # MODIFIED: Support both methods

 security/
    AuthenticationRouter.java        # NEW: Routes to correct auth method
    LocalAuthService.java            # NEW: Local DB authentication
    GoogleAuthService.java           # NEW: Google Identity auth
    JwtTokenProvider.java            # MODIFIED: Add authSource to token
    JwtAuthenticationFilter.java     # MODIFIED: Handle both auth sources

 config/
    SecurityConfig.java              # MODIFIED: Support both providers
    FirebaseConfig.java              # NEW: Google Identity setup

 service/
     UserService.java                 # NEW: Unified user lookup
```

---

## Implementation Details

### 1. Authentication Router

**File:** `security/AuthenticationRouter.java`

```java
package com.secrets.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationRouter {
    
    private final LocalAuthService localAuthService;
    private final GoogleAuthService googleAuthService;
    
    /**
     * Routes authentication request to appropriate handler
     */
    public Authentication authenticate(LoginRequest request) {
        // Detect authentication method
        if (request.hasIdToken()) {
            // Google Cloud Identity Platform
            return googleAuthService.authenticate(request.getIdToken());
        } else if (request.hasUsernamePassword()) {
            // Local database
            return localAuthService.authenticate(
                request.getUsername(), 
                request.getPassword()
            );
        } else {
            throw new IllegalArgumentException("Invalid authentication request");
        }
    }
}
```

### 2. Local Authentication Service

**File:** `security/LocalAuthService.java`

```java
package com.secrets.security;

import com.secrets.entity.User;
import com.secrets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocalAuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public Authentication authenticate(String username, String password) {
        // Load user from local database
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid password");
        }
        
        // Check if account is enabled
        if (!user.getEnabled()) {
            throw new DisabledException("Account is disabled");
        }
        
        // Build authorities from roles
        Collection<? extends GrantedAuthority> authorities = 
            user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toList());
        
        // Create authentication object
        org.springframework.security.core.userdetails.User principal = 
            new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                authorities
            );
        
        return new UsernamePasswordAuthenticationToken(
            principal,
            password,
            authorities
        );
    }
}
```

### 3. Google Authentication Service

**File:** `security/GoogleAuthService.java`

```java
package com.secrets.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {
    
    private final FirebaseAuth firebaseAuth;
    
    @Value("${google.cloud.identity.enabled:false}")
    private boolean enabled;
    
    public Authentication authenticate(String idToken) throws FirebaseAuthException {
        if (!enabled) {
            throw new IllegalStateException("Google Identity Platform is not enabled");
        }
        
        // Validate ID token with Google
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        
        // Extract user information
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String name = decodedToken.getName();
        
        // Extract roles from custom claims
        Collection<? extends GrantedAuthority> authorities = 
            extractAuthorities(decodedToken);
        
        // Create authentication object
        // Use email as username for consistency
        org.springframework.security.core.userdetails.User principal = 
            new org.springframework.security.core.userdetails.User(
                email,  // Username
                "",     // No password needed
                authorities
            );
        
        // Store additional info in authentication details
        GoogleAuthDetails details = GoogleAuthDetails.builder()
            .uid(uid)
            .email(email)
            .name(name)
            .build();
        
        UsernamePasswordAuthenticationToken auth = 
            new UsernamePasswordAuthenticationToken(
                principal,
                idToken,
                authorities
            );
        auth.setDetails(details);
        
        return auth;
    }
    
    private Collection<? extends GrantedAuthority> extractAuthorities(FirebaseToken token) {
        // Extract roles from custom claims
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) token.getClaims().get("roles");
        
        if (roles == null || roles.isEmpty()) {
            // Default to USER role
            roles = List.of("USER");
        }
        
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toList());
    }
}
```

### 4. Modified Auth Controller

**File:** `controller/AuthController.java`

```java
package com.secrets.controller;

import com.secrets.dto.LoginRequest;
import com.secrets.dto.TokenResponse;
import com.secrets.security.AuthenticationRouter;
import com.secrets.security.JwtTokenProvider;
import jakarta.validation.Valid;
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

    private final AuthenticationRouter authenticationRouter;
    private final JwtTokenProvider tokenProvider;

    @Value("${security.jwt.expiration-ms:900000}")
    private long expirationMs;

    /**
     * Unified login endpoint - supports both local and Google authentication
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        log.debug("Login attempt - method: {}", 
            request.hasIdToken() ? "Google" : "Local");
        
        try {
            // Route to appropriate authentication method
            Authentication authentication = authenticationRouter.authenticate(request);
            
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Determine auth source
            String authSource = request.hasIdToken() ? "google" : "local";
            
            // Generate JWT token
            String token = tokenProvider.generateToken(
                userDetails.getUsername(),
                userDetails.getAuthorities(),
                authSource  // Include auth source in token
            );

            TokenResponse response = TokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .authSource(authSource)  // Indicate which method was used
                .build();

            log.info("User {} logged in successfully via {}", 
                userDetails.getUsername(), authSource);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Authentication failed", e);
            return ResponseEntity.status(401)
                .body(TokenResponse.builder()
                    .error("Authentication failed: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * Alternative: Separate endpoints for clarity
     */
    @PostMapping("/login/local")
    public ResponseEntity<TokenResponse> loginLocal(@Valid @RequestBody LocalLoginRequest request) {
        // Local database authentication
        // ... implementation
    }
    
    @PostMapping("/login/google")
    public ResponseEntity<TokenResponse> loginGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        // Google Identity Platform authentication
        // ... implementation
    }
}
```

### 5. Enhanced Login Request DTO

**File:** `dto/LoginRequest.java`

```java
package com.secrets.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    
    // For local authentication
    private String username;
    private String password;
    
    // For Google authentication
    private String idToken;
    
    /**
     * Check if this is a Google authentication request
     */
    public boolean hasIdToken() {
        return idToken != null && !idToken.isBlank();
    }
    
    /**
     * Check if this is a local authentication request
     */
    public boolean hasUsernamePassword() {
        return username != null && password != null 
            && !username.isBlank() && !password.isBlank();
    }
    
    /**
     * Validate that exactly one authentication method is provided
     */
    public boolean isValid() {
        return (hasIdToken() && !hasUsernamePassword()) 
            || (!hasIdToken() && hasUsernamePassword());
    }
}
```

### 6. Enhanced JWT Token Provider

**File:** `security/JwtTokenProvider.java` (Modified)

```java
package com.secrets.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {
    
    @Value("${security.jwt.secret}")
    private String jwtSecret;
    
    @Value("${security.jwt.expiration-ms}")
    private long expirationMs;
    
    /**
     * Generate JWT token with auth source
     */
    public String generateToken(String username, 
                                Collection<? extends GrantedAuthority> authorities,
                                String authSource) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);
        
        List<String> roles = authorities.stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());
        
        return Jwts.builder()
            .subject(username)
            .claim("roles", roles)
            .claim("authSource", authSource)  // NEW: Track auth source
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey())
            .compact();
    }
    
    /**
     * Extract auth source from token
     */
    public String getAuthSource(String token) {
        Claims claims = getClaims(token);
        return claims.get("authSource", String.class);
    }
    
    // ... other methods
}
```

---

## Configuration

### Application Configuration

**File:** `application.yml`

```yaml
spring:
  application:
    name: secret-service
  
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/secrets}
    username: ${SPRING_DATASOURCE_USERNAME:secret_user}
    password: ${SPRING_DATASOURCE_PASSWORD:secret_pw}

security:
  jwt:
    secret: ${JWT_SECRET:mySuperStrongSecretKeyForJWTTokenGeneration123456}
    expiration-ms: 900000  # 15 minutes

# Local authentication (always enabled)
auth:
  local:
    enabled: true

# Google Cloud Identity Platform (optional)
google:
  cloud:
    identity:
      enabled: ${GOOGLE_IDENTITY_ENABLED:false}  # Toggle on/off
      project-id: ${GOOGLE_PROJECT_ID:}
      api-key: ${GOOGLE_API_KEY:}
      service-account-path: ${GOOGLE_SERVICE_ACCOUNT_PATH:}
```

### Environment Variables

```bash
# Enable/disable Google Identity Platform
GOOGLE_IDENTITY_ENABLED=true

# Google Cloud configuration
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_API_KEY=your-api-key
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json

# Local database (always available)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/secrets
SPRING_DATASOURCE_USERNAME=secret_user
SPRING_DATASOURCE_PASSWORD=secret_pw
```

---

## User Management

### Local Users (PostgreSQL)

```java
// Create local user
User user = User.builder()
    .username("alice")
    .email("alice@example.com")
    .passwordHash(passwordEncoder.encode("password123"))
    .enabled(true)
    .build();
user.getRoles().add(User.Role.USER);
userRepository.save(user);
```

### Google Users (Identity Platform)

```java
// Create Google user (via Admin SDK)
UserRecord userRecord = firebaseAuth.createUser(
    new UserRecord.CreateRequest()
        .setEmail("bob@example.com")
        .setPassword("password123")
);

// Set roles as custom claims
Map<String, Object> claims = new HashMap<>();
claims.put("roles", List.of("USER", "ADMIN"));
firebaseAuth.setCustomUserClaims(userRecord.getUid(), claims);
```

### Unified User Lookup

```java
@Service
public class UserService {
    
    /**
     * Get user info regardless of auth source
     */
    public UserInfo getUserInfo(String username, String authSource) {
        if ("local".equals(authSource)) {
            // Query local database
            User user = userRepository.findByUsername(username)
                .orElseThrow();
            return UserInfo.fromLocalUser(user);
        } else if ("google".equals(authSource)) {
            // Query Google Identity Platform
            // Note: username is email for Google users
            UserRecord userRecord = firebaseAuth.getUserByEmail(username);
            return UserInfo.fromGoogleUser(userRecord);
        }
        throw new IllegalArgumentException("Unknown auth source");
    }
}
```

---

## Database Schema

### Secrets Table (Unified)

```sql
-- Secrets table works with both auth sources
CREATE TABLE secrets (
    id BIGSERIAL PRIMARY KEY,
    secret_key VARCHAR(255) UNIQUE NOT NULL,
    encrypted_value VARCHAR(5000) NOT NULL,
    created_by VARCHAR(255) NOT NULL,  -- Username or email
    auth_source VARCHAR(20),            -- 'local' or 'google'
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT DEFAULT 0
);

-- Index for lookups
CREATE INDEX idx_secrets_created_by ON secrets(created_by);
CREATE INDEX idx_secrets_auth_source ON secrets(auth_source);
```

### Audit Logs (Unified)

```sql
-- Audit logs track auth source
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    auth_source VARCHAR(20),  -- 'local' or 'google'
    action VARCHAR(20) NOT NULL,
    secret_key VARCHAR(255),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Security Considerations

### 1. Token Validation

```java
// JWT validation must check auth source
public boolean validateToken(String token) {
    try {
        Claims claims = getClaims(token);
        String authSource = claims.get("authSource", String.class);
        
        // Validate based on auth source
        if ("google".equals(authSource)) {
            // Additional validation for Google tokens
            // (e.g., check if user still exists in Google)
        } else if ("local".equals(authSource)) {
            // Validate local user still exists and is enabled
            String username = claims.getSubject();
            User user = userRepository.findByUsername(username)
                .orElseThrow();
            if (!user.getEnabled()) {
                return false;  // User disabled
            }
        }
        
        return true;
    } catch (Exception e) {
        return false;
    }
}
```

### 2. Role Mapping

Both auth sources must use the same role names:
- `ROLE_USER`
- `ROLE_ADMIN`

Google custom claims should match local database roles.

### 3. User Identifier Consistency

- **Local users**: Use `username` as identifier
- **Google users**: Use `email` as identifier (stored as username in JWT)

Both are stored in `created_by` field, but you can distinguish by `auth_source`.

---

## API Examples

### Example 1: Local Authentication

```bash
# Login with username/password
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "secret123"
  }'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "authSource": "local"
}
```

### Example 2: Google Authentication

```bash
# First, get ID token from Firebase SDK (client-side)
# Then login:
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9..."
  }'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "authSource": "google"
}
```

### Example 3: Using Token (Same for Both)

```bash
# Create secret (works with either token)
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "key": "database-password",
    "value": "mySecret123"
  }'
```

---

## Benefits of Hybrid Approach

### Advantages

1. **Flexibility**: Support both authentication methods
2. **Gradual Migration**: Move users from local to Google gradually
3. **Backward Compatibility**: Existing local users continue to work
4. **Testing**: Can test Google integration without breaking existing auth
5. **Fallback**: If Google service is down, local auth still works
6. **User Choice**: Users can choose their preferred method

### Considerations

1. **Complexity**: More code to maintain
2. **User Confusion**: Users might not know which method to use
3. **Duplicate Users**: Same user might exist in both systems
4. **Synchronization**: Roles need to be kept in sync
5. **Testing**: Need to test both authentication paths

---

## Migration Strategy

### Phase 1: Implement Hybrid (Current)
- Both methods work simultaneously
- New users can choose either method
- Existing users continue using local auth

### Phase 2: Migrate Users
- Create Google accounts for existing users
- Link local accounts to Google accounts
- Users can use either method during transition

### Phase 3: Deprecate Local (Optional)
- Mark local auth as deprecated
- Encourage users to migrate to Google
- Eventually disable local auth

### Phase 4: Google Only (Future)
- Remove local authentication code
- All users use Google Identity Platform
- Simpler architecture

---

## Implementation Checklist

- [ ] Add Google Cloud Identity Platform dependencies
- [ ] Implement `AuthenticationRouter`
- [ ] Implement `LocalAuthService`
- [ ] Implement `GoogleAuthService`
- [ ] Modify `AuthController` to support both methods
- [ ] Update `JwtTokenProvider` to include auth source
- [ ] Update `LoginRequest` DTO
- [ ] Add configuration for both methods
- [ ] Update database schema (add `auth_source` field)
- [ ] Update audit logging to track auth source
- [ ] Add tests for both authentication methods
- [ ] Update API documentation
- [ ] Create migration guide for users

---

## Summary

A **hybrid user registry architecture** allows the system to support both:
- **Local Database**: Traditional username/password (PostgreSQL)
- **Google Cloud Identity Platform**: Cloud-based user registry with ID tokens

**Key Components:**
1. `AuthenticationRouter` - Routes requests to correct auth method
2. `LocalAuthService` - Handles local database authentication
3. `GoogleAuthService` - Handles Google Identity Platform authentication
4. Enhanced JWT tokens - Include `authSource` to track method used
5. Unified user lookup - Service to get user info regardless of source

**Benefits:**
- Flexibility and gradual migration
- Backward compatibility
- User choice
- Fallback option

This approach provides the best of both worlds while allowing a smooth transition from local to cloud-based user management.

