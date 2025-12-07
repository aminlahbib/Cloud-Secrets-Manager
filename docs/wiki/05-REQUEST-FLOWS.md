# Request & Sequence Flows

## Overview

This page describes how requests flow through the system for key operations. Understanding these flows helps with debugging and development.

---

## Authentication Flow (Login)

The login flow integrates Firebase authentication with the backend session management.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Frontend
    participant Firebase
    participant SecretService
    participant Database
    
    User->>Browser: Click "Sign in with Google"
    Browser->>Frontend: Trigger login
    Frontend->>Firebase: signInWithPopup()
    Firebase->>Browser: Google OAuth popup
    Browser->>Firebase: User consents
    Firebase->>Frontend: Firebase ID Token
    
    Frontend->>SecretService: POST /api/auth/login {idToken}
    SecretService->>Firebase: Verify ID Token
    Firebase->>SecretService: Decoded token (uid, email, claims)
    
    SecretService->>Database: Find or create user
    Database->>SecretService: User record
    
    SecretService->>Database: Create default workflow (if new user)
    SecretService->>SecretService: Generate access + refresh tokens
    SecretService->>Frontend: {accessToken, refreshToken, user}
    
    Frontend->>Frontend: Store tokens in memory
    Frontend->>Browser: Redirect to dashboard
```

**Key Points:**
- Firebase handles the OAuth complexity
- Backend validates Firebase tokens and creates local sessions
- New users get a default workflow created automatically
- Access tokens are short-lived (15 minutes); refresh tokens last 7 days

---

## Secret Creation Flow

Creating a secret involves encryption, storage, and audit logging.

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant SecretService
    participant Database
    participant AuditService
    participant PubSub
    
    User->>Frontend: Fill secret form
    Frontend->>SecretService: POST /api/secrets {projectId, key, value}
    
    SecretService->>SecretService: Validate JWT token
    SecretService->>Database: Check project membership
    Database->>SecretService: User has MEMBER+ role
    
    SecretService->>SecretService: Encrypt value (AES-256-GCM)
    SecretService->>Database: INSERT secret
    Database->>SecretService: Secret created
    
    SecretService->>AuditService: POST /api/audit {action: CREATE}
    SecretService->>PubSub: Publish secret.created event
    
    SecretService->>Frontend: 201 Created {secret}
    Frontend->>User: Show success message
```

**Key Points:**
- Authorization check happens before any data operation
- Encryption occurs in the service layer, not the database
- Audit logging is synchronous to ensure compliance
- Pub/Sub event enables async notifications

---

## Secret Retrieval Flow

Retrieving a secret value requires authorization and generates an audit record.

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant SecretService
    participant Database
    participant AuditService
    
    User->>Frontend: Click "reveal secret"
    Frontend->>SecretService: GET /api/secrets/{id}
    
    SecretService->>SecretService: Validate JWT token
    SecretService->>Database: Get secret with project
    Database->>SecretService: Secret record
    
    SecretService->>Database: Check project membership
    Database->>SecretService: User has VIEWER+ role
    
    SecretService->>SecretService: Decrypt value
    SecretService->>AuditService: POST /api/audit {action: ACCESS}
    
    SecretService->>Frontend: 200 OK {secret with value}
    Frontend->>User: Display secret value
```

**Key Points:**
- Every access is logged for compliance
- Decryption only happens after authorization succeeds
- The value is never logged or stored in plaintext

---

## Project Invitation Flow

Inviting a user involves email notification and pending invitation tracking.

```mermaid
sequenceDiagram
    actor Owner
    participant Frontend
    participant SecretService
    participant Database
    participant PubSub
    participant NotificationService
    participant EmailProvider
    
    Owner->>Frontend: Enter email and role
    Frontend->>SecretService: POST /api/projects/{id}/invitations
    
    SecretService->>Database: Check owner has ADMIN+ role
    SecretService->>SecretService: Generate invitation token
    SecretService->>Database: Create invitation record
    
    SecretService->>PubSub: Publish invitation.created event
    SecretService->>Frontend: 201 Created
    
    PubSub->>NotificationService: Receive event
    NotificationService->>EmailProvider: Send invitation email
    EmailProvider->>NotificationService: Email sent
```

**Key Points:**
- Invitation tokens expire after a configured period
- If the invitee already has an account, they see the invitation immediately
- Email sending is asynchronous via Pub/Sub

---

## Token Refresh Flow

Maintaining sessions without forcing re-login.

```mermaid
sequenceDiagram
    participant Frontend
    participant SecretService
    participant Redis
    
    Frontend->>SecretService: POST /api/auth/refresh {refreshToken}
    
    SecretService->>Redis: Check token not blacklisted
    Redis->>SecretService: Token valid
    
    SecretService->>SecretService: Validate refresh token signature
    SecretService->>SecretService: Generate new access token
    
    SecretService->>Frontend: {accessToken}
```

**Key Points:**
- Refresh tokens can be revoked by blacklisting in Redis
- Access tokens are rotated frequently for security
- Logout blacklists the refresh token

---

## General Request Pattern

All authenticated API requests follow this pattern:

1. **Request arrives** at the API gateway / ingress
2. **JWT validation** extracts user identity and claims
3. **Authorization check** verifies the user can perform the action
4. **Business logic** executes the operation
5. **Audit logging** records the action
6. **Response** returns to the client

**Error Handling:**
- 401 Unauthorized — Invalid or missing token
- 403 Forbidden — Valid token but insufficient permissions
- 404 Not Found — Resource doesn't exist or user can't see it
- 422 Unprocessable Entity — Validation errors

---

**Next:** [Infrastructure & Deployment →](./06-INFRASTRUCTURE-AND-DEPLOYMENT.md)
