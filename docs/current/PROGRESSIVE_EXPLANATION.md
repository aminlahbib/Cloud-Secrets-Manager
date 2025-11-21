# Cloud Secrets Manager - Progressive Deep Dive 

This document explains the project in layers, starting from the highest level and going deeper bit by bit.

---

## **CURRENT: User Registry Architecture**

**This project uses Google Cloud Identity Platform as the user registry**  **IMPLEMENTED**

- **Current State**:  Google Cloud Identity Platform (cloud-based user registry) - **ACTIVE**
- **Previous State**: Local PostgreSQL database for users (removed - no longer in codebase)
- **Status**:  Fully implemented and in use

**Why Google Cloud Identity Platform?**
- No local user database needed
- Built-in MFA, social login, password reset
- Enterprise-grade security and compliance
- Automatic scaling
- Managed service (less code to maintain)

**Implementation Status:**
- Google Cloud Identity Platform is **fully implemented and active**
- All authentication uses Google ID tokens
- User management via Firebase Admin SDK
- Roles and permissions stored in custom claims
- See `docs/completed/HYBRID_USER_REGISTRY_ARCHITECTURE.md` for reference on hybrid approach (not implemented)

Throughout this document, the current Google Cloud Identity Platform architecture is explained.

---

## **LEVEL 1: The Big Picture (What & Why)**

### What is This Project?
A **Cloud Secrets Manager** is like a digital bank vault for passwords, API keys, and other sensitive information that applications need to run.

### The Core Problem
Modern applications need secrets to function:
- Database passwords
- API keys for third-party services
- Encryption keys
- Access tokens

**The challenge:** Where do you store these safely?

### The Solution
This project provides:
1. **Secure Storage** - Secrets are encrypted before being saved
2. **Access Control** - Only authorized people can see secrets
3. **Audit Trail** - Every access is logged (who, what, when)
4. **Centralized Management** - One place to manage all secrets
5. **User Registry** - Uses Google Cloud Identity Platform for user management  **IMPLEMENTED**

### Current Architecture: Google Cloud Identity Platform

**Current State (Active):**
- **User Registry**: Google Cloud Identity Platform (cloud-based user management)
- **Authentication**: Google ID tokens (no local user database needed)
- **User Management**: All handled by Google Cloud Identity Platform
- **Benefits**: MFA, social login, password reset, enterprise features out of the box

**Previous State (Removed):**
- Users stored in local PostgreSQL database (removed from codebase)
- Traditional username/password authentication (removed from codebase)
- User entity, UserRepository, and DataInitializer have been removed

**Note:** Google Cloud Identity Platform is fully implemented and active. All local user database code has been removed.

---

## **LEVEL 2: System Architecture (The Big Picture Structure)**

### High-Level Architecture

#### Previous Architecture (Removed - Local User Database)
```
 This architecture has been removed. All user management now uses Google Cloud Identity Platform.
```

#### Current Architecture (Google Cloud Identity Platform - Active)
```

                    YOU (The User)                        
              (curl, Postman, Web App)                    

                        
                        
        
                                       
                                       
          
  Secret Service              Audit Service   
   (Port 8080)                 (Port 8081)    
                                              
 - Stores secrets            - Logs events    
 - Encrypts data   - Tracks access  
 - Controls access  REST     - Compliance     
 - Validates                                  
   Google tokens                              
          
                                      
                                      
                                      
          
   Secrets DB                  Audit DB       
  (PostgreSQL)                (PostgreSQL)    
                                              
 - Encrypted                 - Audit logs     
   secrets                   - Timestamps     
          
         
         
         

  Google Cloud Identity Platform      
  (User Registry - Cloud)             
                                      
  - User authentication               
  - User data storage                 
  - Roles (custom claims)             
  - MFA, password reset, etc.         
  - Social login support              

```

**Key Difference:**
- **Active**:  Users managed by Google Cloud Identity Platform (cloud user registry)
- **Deprecated**: Users stored in local PostgreSQL database (no longer used)
- **Benefit**: No need to manage user database, passwords, MFA, etc. - all handled by Google

### Two Microservices Working Together

**1. Secret Service (Port 8080)**
- The main service that handles secret operations
- Stores, retrieves, updates, and deletes secrets
- Handles authentication and authorization
- Encrypts/decrypts secrets

**2. Audit Service (Port 8081)**
- The "security guard" that watches everything
- Logs all operations (CREATE, READ, UPDATE, DELETE)
- Tracks who did what and when
- Provides compliance reporting

### Why Two Separate Services?
- **Separation of Concerns**: Each service has one job
- **Scalability**: Can scale independently
- **Security**: Audit logs are isolated from secrets
- **Database Isolation**: Secrets and audit logs in separate databases

---

## **LEVEL 3: Technology Stack (What Tools Are Used)**

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Language** | Java 21 | Modern, secure programming language |
| **Framework** | Spring Boot 3.3 | Makes building web services easy |
| **Security** | Spring Security | Handles authentication & authorization |
| **Database** | PostgreSQL 16 | Stores secrets and audit logs |
| **Authentication** | JWT (JSON Web Tokens) | Secure token-based auth |
| **Encryption** | AES-256-GCM | Encrypts secrets before storage |
| **API Docs** | OpenAPI/Swagger | Auto-generated API documentation |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containers** | Docker | Package everything into containers |
| **Orchestration** | Docker Compose | Run all services together locally |
| **Cloud** | Kubernetes | Deploy to cloud (production) |
| **Package Manager** | Helm | Easy Kubernetes deployments |

---

## **LEVEL 4: How It Works (The Flow)**

### Step-by-Step: Creating a Secret

```
1. YOU send request:
   POST /api/secrets
   {
     "key": "database-password",
     "value": "mySecret123"
   }
   + JWT Token (proves you're logged in)

2. SECRET SERVICE receives request:
   CHECK Validates JWT token (are you logged in?)
   CHECK Checks permissions (are you allowed?)
   CHECK Encrypts the value: "mySecret123"  "xK9#mP2$vL8..."
   CHECK Saves to database

3. AUDIT SERVICE logs the event:
   CHECK Records: "User 'alice' created secret 'database-password' at 3:00 PM"

4. YOU get response:
   {
     "key": "database-password",
     "value": "mySecret123",  // Decrypted for you
     "createdAt": "2025-01-15T15:00:00"
   }
```

### Step-by-Step: Retrieving a Secret

```
1. YOU send request:
   GET /api/secrets/database-password
   + JWT Token

2. SECRET SERVICE:
   CHECK Validates JWT token
   CHECK Checks READ permission
   CHECK Fetches encrypted value from database
   CHECK Decrypts: "xK9#mP2$vL8..."  "mySecret123"

3. AUDIT SERVICE logs:
   CHECK Records: "User 'alice' READ secret 'database-password' at 3:05 PM"

4. YOU get the secret back (decrypted)
```

---

## **LEVEL 5: Code Structure (How Code is Organized)**

### Secret Service Structure

```
secret-service/
 src/main/java/com/secrets/
    SecretServiceApplication.java    # Main entry point
   
    controller/                      # HTTP endpoints
       AuthController.java          # Login, token refresh
       SecretController.java        # CRUD operations
   
    service/                         # Business logic
       SecretService.java           # Main secret operations
       EncryptionService.java       # Encryption interface
       AesEncryptionService.java    # AES implementation
   
    entity/                          # Database models
       Secret.java                  # Secret table structure
       SecretVersion.java           # Version history
       RefreshToken.java            # Refresh tokens
   
    repository/                      # Database access
       SecretRepository.java        # Secret queries
       SecretVersionRepository.java # Version queries
       RefreshTokenRepository.java  # Refresh token queries
   
    security/                        # Authentication
       JwtTokenProvider.java        # Creates/validates JWT
       JwtAuthenticationFilter.java # Checks JWT on requests
       GoogleIdentityTokenValidator.java # Validates Google ID tokens
       PermissionEvaluator.java     # Checks user permissions
   
    config/                          # Configuration
       SecurityConfig.java          # Security rules
       WebClientConfig.java         # HTTP client setup
   
    client/                          # External service calls
       AuditClient.java             # Calls audit service
   
    dto/                             # Data transfer objects
       SecretRequest.java           # Request format
       SecretResponse.java          # Response format
       LoginRequest.java            # Login format
   
    exception/                       # Error handling
        GlobalExceptionHandler.java  # Catches all errors
```

### Audit Service Structure

```
audit-service/
 src/main/java/com/audit/
    AuditServiceApplication.java     # Main entry point
   
    controller/                      # HTTP endpoints
       AuditController.java         # Log & query endpoints
   
    service/                         # Business logic
       AuditService.java            # Audit operations
   
    entity/                          # Database models
       AuditLog.java                # Audit log structure
   
    repository/                      # Database access
       AuditLogRepository.java      # Audit queries
   
    dto/                             # Data transfer objects
        AuditLogRequest.java         # Request format
        AuditLogResponse.java        # Response format
```

---

## **LEVEL 6: Key Components Deep Dive**

### 1. Secret Entity (Database Model)

```java
@Entity
public class Secret {
    private Long id;                      // Unique ID
    private String secretKey;             // Name (e.g., "database-password")
    private String encryptedValue;        // Encrypted secret (NOT plaintext!)
    private String createdBy;             // Who created it
    private LocalDateTime createdAt;      // When created
    private LocalDateTime updatedAt;      // Last update time
    private Long version;                 // For optimistic locking
}
```

**Key Points:**
- `encryptedValue` is NEVER stored in plaintext
- `secretKey` is the name you use to retrieve it
- `version` prevents conflicts when multiple people update

### 2. SecretService (Business Logic)

```java
@Service
public class SecretService {
    
    // Creates a new secret
    public Secret createSecret(String key, String value, String createdBy) {
        1. Check if secret already exists
        2. Encrypt the value
        3. Save to database
        4. Log to audit service
        5. Return saved secret
    }
    
    // Gets a secret
    public Secret getSecret(String key, String username) {
        1. Find secret in database
        2. Log access to audit service
        3. Return secret (still encrypted)
    }
    
    // Decrypts a secret value
    public String decryptSecretValue(Secret secret) {
        1. Take encrypted value
        2. Decrypt using encryption key
        3. Return plaintext
    }
}
```

**Key Points:**
- All operations are transactional (all-or-nothing)
- Every operation is logged to audit service
- Secrets are encrypted/decrypted on-the-fly

### 3. Encryption Service

```java
@Service
public class AesEncryptionService implements EncryptionService {
    
    // Encrypts plaintext
    public String encrypt(String plaintext) {
        1. Generate random initialization vector (IV)
        2. Use AES-256-GCM encryption
        3. Combine IV + encrypted data
        4. Encode to Base64
        5. Return encrypted string
    }
    
    // Decrypts ciphertext
    public String decrypt(String ciphertext) {
        1. Decode from Base64
        2. Extract IV
        3. Use AES-256-GCM decryption
        4. Return plaintext
    }
}
```

**Key Points:**
- Uses AES-256 (military-grade encryption)
- GCM mode provides authentication (detects tampering)
- Each encryption uses a random IV (same secret, different ciphertext)

### 4. Authentication  **IMPLEMENTED: Google Cloud Identity Platform**

#### Current Implementation (Active)
```java
// When you login:
1. Send username + password
2. System queries PostgreSQL users table
3. Checks password hash (BCrypt)
4. Creates JWT token containing:
   - Username
   - Roles (USER, ADMIN)
   - Expiration time
5. Returns token

// When you make requests:
1. Include token in header: "Authorization: Bearer <token>"
2. System validates token:
   - Is it expired?
   - Is signature valid?
   - Extract username and roles
3. Allow or deny request
```

#### Implementation Details (Google Cloud Identity Platform)
```java
// When you login:
1. Client authenticates with Google Identity Platform (Firebase SDK)
2. Google returns ID token (contains user info + roles)
3. Client sends ID token to backend
4. Backend validates ID token with Google
5. Backend extracts user info and roles from token
6. Backend creates JWT token for API calls
7. Returns token

// When you make requests:
1. Include token in header: "Authorization: Bearer <token>"
2. System validates token:
   - Is it expired?
   - Is signature valid?
   - Extract username and roles (from token, not database)
3. Allow or deny request
```

**Key Differences:**
- **Active**: Google ID token  Google validates  JWT 
- **Active**: User data in Google Cloud Identity Platform 
- **Deprecated**: Username/password  Local DB (no longer used)

**JWT Token Structure (Same for both):**
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "username": "alice", "roles": ["USER"], "exp": 1234567890 }
Signature: HMAC(header + payload, secret)
```

### 5. Audit Service

```java
// When secret service logs an event:
POST /api/audit/log
{
  "username": "alice",
  "action": "READ",
  "secretKey": "database-password"
}

// Audit service stores:
{
  "id": 123,
  "username": "alice",
  "action": "READ",
  "secretKey": "database-password",
  "timestamp": "2025-01-15T15:05:00",
  "ipAddress": "192.168.1.100"
}
```

**Key Points:**
- Every operation is logged
- Includes IP address and timestamp
- Can query by user, secret, or date range

---

## **LEVEL 7: Configuration Deep Dive**

### Application Configuration (application.yml)

```yaml
# Database Connection
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/secrets
    username: secret_user
    password: secret_pw

# JWT Settings
security:
  jwt:
    secret: mySuperStrongSecretKey...
    expiration-ms: 900000  # 15 minutes

# Encryption Settings
encryption:
  key: MySecure32ByteKeyForAES256Enc!@#
  algorithm: AES
  transformation: AES/GCM/NoPadding

# Audit Service URL
audit:
  service:
    url: http://localhost:8081
    timeout: 5000
```

### Docker Compose Configuration

```yaml
services:
  secret-service:
    build: ./secret-service
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://secrets-db:5432/secrets
      JWT_SECRET: mySuperStrongSecretKey...
      ENCRYPTION_KEY: MySecure32ByteKey...
    depends_on:
      - secrets-db
      - audit-service

  secrets-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: secrets
      POSTGRES_USER: secret_user
      POSTGRES_PASSWORD: secret_pw
```

**Key Points:**
- Environment variables for sensitive config
- Services depend on databases
- All services on same network

---

## **LEVEL 8: Security Deep Dive**

### Security Layers

**1. Network Security**
- HTTPS/TLS encryption in transit
- Services communicate over private network
- Firewall rules in Kubernetes

**2. Authentication**
- JWT tokens (stateless, scalable)
- Password hashing with BCrypt
- Token expiration (15 minutes)

**3. Authorization**
- Role-based access control (RBAC)
- USER vs ADMIN roles
- Permission checks on every request

**4. Data Security**
- AES-256 encryption at rest
- Secrets never in plaintext
- Encryption key stored securely

**5. Audit & Compliance**
- Every operation logged
- Immutable audit trail
- IP address tracking

### Encryption Details

**AES-256-GCM:**
- **AES**: Advanced Encryption Standard
- **256**: 256-bit key (very strong)
- **GCM**: Galois/Counter Mode (authenticated encryption)

**Why GCM?**
- Provides confidentiality (can't read)
- Provides authenticity (can't tamper)
- Detects if data was modified

**Key Management:**
- Currently: Key in environment variable (MVP)
- Production: HashiCorp Vault or AWS KMS (planned)

---

## **LEVEL 9: API Endpoints**

### Secret Service Endpoints

```
Authentication:
POST   /api/auth/login          # Login, get JWT token
POST   /api/auth/refresh        # Refresh expired token

Secret Operations:
POST   /api/secrets             # Create secret
GET    /api/secrets/{key}       # Get secret
PUT    /api/secrets/{key}       # Update secret
DELETE /api/secrets/{key}       # Delete secret

Health:
GET    /actuator/health         # Service health check
GET    /actuator/metrics        # Performance metrics
```

### Audit Service Endpoints

```
Audit Operations:
POST   /api/audit/log           # Log an event (internal)
GET    /api/audit               # Get all logs
GET    /api/audit/{username}    # Get logs for user
GET    /api/audit/secret/{key}  # Get logs for secret

Health:
GET    /actuator/health         # Service health check
```

### Example API Calls

#### Implementation (Google Cloud Identity Platform - Active)
```bash
# 1. Login (username/password)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

#### Implementation Details (Google Cloud Identity Platform)
```bash
# 1. Login (Google ID token)
# First, get ID token from Firebase SDK (client-side)
# Then send to backend:
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9..."}'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

#### Common Operations (Same for both)
```bash
# 2. Create Secret
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"key": "db-password", "value": "secret123"}'

# 3. Get Secret
curl -X GET http://localhost:8080/api/secrets/db-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. View Audit Logs
curl -X GET http://localhost:8081/api/audit \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## **LEVEL 10: Database Schema**

### Secrets Database

#### Current Schema (Google Cloud Identity Platform)
```sql
-- Note: Users are managed in Google Cloud Identity Platform, not in local database
-- User roles and permissions are stored as custom claims in Google Identity Platform

-- Secrets table
CREATE TABLE secrets (
    id BIGSERIAL PRIMARY KEY,
    secret_key VARCHAR(255) UNIQUE NOT NULL,
    encrypted_value VARCHAR(5000) NOT NULL,
    created_by VARCHAR(50) NOT NULL,  -- References email/username from Google Identity
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT DEFAULT 0
);
```

#### Current Schema (Active)
```sql
-- Users table: NOT NEEDED (managed by Google Cloud Identity Platform)
-- User roles: NOT NEEDED (stored as custom claims in Google Identity Platform)

-- Secrets table
CREATE TABLE secrets (
    id BIGSERIAL PRIMARY KEY,
    secret_key VARCHAR(255) UNIQUE NOT NULL,
    encrypted_value VARCHAR(5000) NOT NULL,
    created_by VARCHAR(255) NOT NULL,  -- References email from Google Identity Platform
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT DEFAULT 0
);
```

**Note:** With Google Cloud Identity Platform:
- No `users` table needed
- No `user_roles` table needed
- User data stored in Google Cloud Identity Platform (user registry)
- Roles stored as custom claims in Google ID tokens
- `created_by` field still references user email/identifier

### Audit Database

```sql
-- Audit logs table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,  -- CREATE, READ, UPDATE, DELETE
    secret_key VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_audit_username ON audit_logs(username);
CREATE INDEX idx_audit_secret_key ON audit_logs(secret_key);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

---

## **LEVEL 11: Request Lifecycle (Complete Flow)**

### Complete Request Flow: Creating a Secret

```

 STEP 1: Client Request                                       

Client sends:
  POST /api/secrets
  Headers: Authorization: Bearer <JWT_TOKEN>
  Body: {"key": "db-password", "value": "secret123"}


 STEP 2: Spring Security Filter Chain                        

JwtAuthenticationFilter:
  1. Extracts token from "Authorization" header
  2. Validates token signature
  3. Checks expiration
  4. Extracts username and roles
  5. Creates Authentication object
  6. Sets SecurityContext


 STEP 3: Controller Layer                                    

SecretController.createSecret():
  1. Receives SecretRequest DTO
  2. Gets username from SecurityContext
  3. Calls SecretService.createSecret()


 STEP 4: Service Layer                                       

SecretService.createSecret():
  1. Checks if secret already exists
  2. Calls EncryptionService.encrypt("secret123")
  3. Creates Secret entity
  4. Saves to database (via Repository)
  5. Calls AuditClient.logEvent() (async)
  6. Returns Secret entity


 STEP 5: Encryption Service                                  

AesEncryptionService.encrypt():
  1. Generates random IV (Initialization Vector)
  2. Creates Cipher with AES-256-GCM
  3. Encrypts: "secret123"  encrypted bytes
  4. Combines IV + encrypted bytes
  5. Encodes to Base64
  6. Returns: "xK9#mP2$vL8..."


 STEP 6: Database Layer                                      

SecretRepository.save():
  1. Hibernate converts entity to SQL
  2. Executes: INSERT INTO secrets (...)
  3. PostgreSQL stores encrypted value
  4. Returns saved entity with ID


 STEP 7: Audit Logging (Async)                              

AuditClient.logEvent():
  1. Creates AuditLogRequest
  2. Sends POST to http://audit-service:8081/api/audit/log
  3. AuditService saves log entry
  4. Returns immediately (doesn't wait)


 STEP 8: Response                                            

Controller:
  1. Decrypts secret value (for response)
  2. Converts to SecretResponse DTO
  3. Returns HTTP 201 Created
  4. Client receives:
     {
       "key": "db-password",
       "value": "secret123",
       "createdAt": "2025-01-15T15:00:00"
     }
```

---

## **LEVEL 12: Deployment Architecture**

### Local Development (Docker Compose)

```

                    Docker Network                        
                                                          
                        
   secret-          audit-                        
   service           service                        
   :8080             :8081                          
                        
                                                       
                                                       
                        
   secrets-db        audit-db                       
   :5432             :5432                          
                        
                                                          

                                    
          Port Mapping              
                                    
  localhost:8080            localhost:8081
  localhost:5433            localhost:5434
```

### Production (Kubernetes)

```

                    Kubernetes Cluster                    
                                                          
        
                Ingress Controller                     
           (Routes external traffic)                   
        
                                                        
                           
                                                      
                                                      
                       
   secret-                audit-                 
   service                 service                 
   (3 replicas)            (2 replicas)            
                       
                                                      
                                                      
                       
   secrets-db              audit-db                
   (StatefulSet)           (StatefulSet)           
                       
                                                         

```

**Key Differences:**
- **Local**: Single container per service
- **Production**: Multiple replicas for high availability
- **Local**: Direct port access
- **Production**: Ingress for external access
- **Local**: Simple networking
- **Production**: Service discovery, load balancing

---

## **LEVEL 13: Advanced Concepts**

### Transaction Management

```java
@Transactional
public Secret createSecret(...) {
    // All database operations in this method
    // are part of ONE transaction
    
    // If ANY step fails, ALL changes are rolled back
    // This ensures data consistency
}
```

**Why Important:**
- If encryption succeeds but database save fails, nothing is saved
- Prevents partial updates
- Ensures audit log matches actual operations

### Async Audit Logging

```java
// Audit logging is asynchronous
auditClient.logEvent(...);  // Returns immediately
// Doesn't wait for audit service response
```

**Why Async:**
- Secret operations don't wait for audit logging
- Faster response times
- Audit service can be slow without affecting secrets

**Trade-off:**
- If audit service is down, operation still succeeds
- Audit log might be slightly delayed

### Optimistic Locking

```java
@Entity
public class Secret {
    @Version
    private Long version;  // Auto-incremented on update
}
```

**How It Works:**
1. User A reads secret (version = 1)
2. User B reads secret (version = 1)
3. User A updates secret (version becomes 2)
4. User B tries to update (version still 1)
5. Update fails - prevents overwriting User A's changes

**Why Important:**
- Prevents lost updates
- No database locks needed
- Better performance than pessimistic locking

### Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10    # Max 10 connections
      minimum-idle: 5          # Keep 5 ready
      connection-timeout: 30000 # 30 seconds
```

**Why Important:**
- Database connections are expensive to create
- Pool reuses connections
- Improves performance significantly

---

## **LEVEL 14: Current Status & Future Plans**

### What's Working (MVP)

- Basic CRUD operations (Create, Read, Update, Delete)
- JWT authentication (with local database)
- AES-256 encryption
- Audit logging
- Docker Compose deployment
- Kubernetes deployment
- Health checks
- API documentation (Swagger)
- **User Management**: Using Google Cloud Identity Platform 

### What's Planned (Production)

**High Priority:**
- **Google Cloud Identity Platform Integration** (user registry) - **IMPLEMENTED**
  - Replaced local user database with Google Identity Platform
  - Using Google ID tokens for authentication
  - Storing roles as custom claims in Google Identity Platform
  - MFA, social login, password reset available

**Other Features:**
- Secret versioning (track all changes) - **IMPLEMENTED**
- Advanced RBAC (fine-grained permissions) - **IMPLEMENTED**
- Token refresh mechanism - **IMPLEMENTED**
- Comprehensive testing (60%+ coverage) - **IN PROGRESS**
- Secret expiration (auto-delete old secrets)
- Automatic rotation (change secrets periodically)
- Vault/KMS integration (better key management)
- Rate limiting (prevent abuse)
- Monitoring (Prometheus, Grafana)
- Distributed tracing (OpenTelemetry)

### Current Progress: ~45%

- MVP Foundation:  100%
- Enhanced Security:  85%
- Production Features:  60%
- Monitoring:  10%
- Testing:  60%

---

## **LEVEL 15: Real-World Usage Examples**

### Example 1: Storing Database Password

```bash
# Your application needs a database password
# Instead of hardcoding it:

#  BAD:
database.password=mySecretPassword123

#  GOOD:
# Store in secrets manager
curl -X POST /api/secrets \
  -d '{"key": "prod-db-password", "value": "mySecretPassword123"}'

# Your app retrieves it at startup:
curl -X GET /api/secrets/prod-db-password
# Returns: "mySecretPassword123"
```

### Example 2: API Key Management

```bash
# Store API keys for third-party services
curl -X POST /api/secrets \
  -d '{"key": "stripe-api-key", "value": "sk_live_..."}'

curl -X POST /api/secrets \
  -d '{"key": "sendgrid-api-key", "value": "SG.abc123..."}'

# When you need to rotate (change) a key:
curl -X PUT /api/secrets/stripe-api-key \
  -d '{"value": "sk_live_NEW_KEY..."}'
```

### Example 3: Compliance Audit

```bash
# Security team needs to see who accessed what:
curl -X GET /api/audit/secret/stripe-api-key

# Returns:
[
  {
    "username": "alice",
    "action": "READ",
    "timestamp": "2025-01-15T10:00:00",
    "ipAddress": "192.168.1.100"
  },
  {
    "username": "bob",
    "action": "UPDATE",
    "timestamp": "2025-01-15T11:00:00",
    "ipAddress": "192.168.1.101"
  }
]
```

---

## **Summary: What You've Learned**

You now understand:

1. **What** the project does (secure secret storage)
2. **Why** it exists (security problem)
3. **How** it's structured (two microservices)
4. **What** technologies it uses (Java, Spring Boot, PostgreSQL)
5. **How** requests flow through the system
6. **How** code is organized (layered architecture)
7. **How** security works (encryption, JWT, RBAC)
8. **How** it's deployed (Docker, Kubernetes)
9. **What** the database looks like
10. **What** the API endpoints are
11. **How** transactions and async operations work
12. **What** the current status is
13. **How** it's used in practice
14. **Important**: The project uses **Google Cloud Identity Platform** as the user registry  **IMPLEMENTED**

## **Key Architecture Note: User Registry**

**Current State (Active):**
- **User Registry**: Google Cloud Identity Platform (cloud-based)
- **Authentication**: Google ID tokens (validated by Firebase Admin SDK)
- **User Management**: All handled by Google Cloud Identity Platform
- **Benefits**: 
  - No local user database needed
  - Built-in MFA, social login, password reset
  - Enterprise-grade security and compliance
  - Automatic scaling

**Previous State (Deprecated):**
- Users stored in local PostgreSQL database (no longer used)
- Traditional username/password authentication (no longer used)

**Documentation Available:**
- See `docs/completed/google-cloud-identity-integration-guide.md` for implementation guide
- See `docs/current/google-cloud-identity-quick-reference.md` for quick reference
- See `docs/current/GOOGLE_IDENTITY_SETUP.md` for setup guide

**Status:**  Fully implemented and active in production code.

---

## **Next Steps**

Want to go even deeper? Here are some areas to explore:

1. **Read the actual code** - Start with `SecretService.java`
2. **Run it locally** - `docker-compose up`
3. **Try the API** - Use Postman or curl
4. **Read the logs** - See what happens behind the scenes
5. **Modify something** - Add a new feature
6. **Deploy to Kubernetes** - See it in production mode

---

**Questions?** Check the other documentation files or explore the codebase!

