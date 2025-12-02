# Two-Factor Authentication (TOTP) - Technical Design Document

**Version:** 1.0  
**Date:** December 1, 2025  
**Status:** Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Entity Changes](#entity-changes)
4. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
5. [API Endpoints](#api-endpoints)
6. [Security Considerations](#security-considerations)
7. [Implementation Checklist](#implementation-checklist)

---

## Overview

This document defines the complete technical specification for implementing **TOTP (Time-based One-Time Password)** two-factor authentication in Cloud Secrets Manager. The implementation will be **opt-in** and support authenticator apps like Google Authenticator, 1Password, Authy, etc.

### Key Features

- **TOTP-based 2FA** using RFC 6238 standard
- **Recovery codes** (10 one-time use codes)
- **Two-step login flow** for users with 2FA enabled
- **Secure secret storage** (encrypted at rest)
- **Rate limiting** to prevent brute force attacks

---

## Database Schema

### Migration: V9__add_two_factor_authentication.sql

```sql
-- =============================================================================
-- Migration: Add Two-Factor Authentication Support
-- =============================================================================
-- Adds TOTP-based 2FA fields to users table
-- =============================================================================

-- Add 2FA columns to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS two_factor_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS two_factor_secret TEXT, -- Encrypted TOTP secret
    ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[], -- Array of hashed recovery codes
    ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS two_factor_last_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pending_two_factor_secret TEXT, -- Temporary during setup
    ADD COLUMN IF NOT EXISTS pending_two_factor_created_at TIMESTAMPTZ;

-- Create index for users with 2FA enabled (for quick lookups during login)
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled 
    ON users(two_factor_enabled) 
    WHERE two_factor_enabled = TRUE;

-- Add check constraint to ensure two_factor_type is valid when enabled
ALTER TABLE users
    ADD CONSTRAINT chk_two_factor_type 
    CHECK (
        (two_factor_enabled = FALSE AND two_factor_type IS NULL) OR
        (two_factor_enabled = TRUE AND two_factor_type IS NOT NULL)
    );

-- Add check constraint to ensure secret exists when enabled
ALTER TABLE users
    ADD CONSTRAINT chk_two_factor_secret 
    CHECK (
        (two_factor_enabled = FALSE AND two_factor_secret IS NULL) OR
        (two_factor_enabled = TRUE AND two_factor_secret IS NOT NULL)
    );
```

---

## Entity Changes

### User.java Updates

Add the following fields to `com.secrets.entity.User`:

```java
@Column(name = "two_factor_enabled", nullable = false)
private Boolean twoFactorEnabled = false;

@Column(name = "two_factor_type", length = 20)
private String twoFactorType; // "TOTP"

@Column(name = "two_factor_secret", columnDefinition = "TEXT")
private String twoFactorSecret; // Encrypted TOTP secret

@JdbcTypeCode(SqlTypes.ARRAY)
@Column(name = "two_factor_recovery_codes", columnDefinition = "TEXT[]")
private List<String> twoFactorRecoveryCodes; // Hashed recovery codes

@Column(name = "two_factor_enabled_at")
private LocalDateTime twoFactorEnabledAt;

@Column(name = "two_factor_last_verified_at")
private LocalDateTime twoFactorLastVerifiedAt;

@Column(name = "pending_two_factor_secret", columnDefinition = "TEXT")
private String pendingTwoFactorSecret; // Temporary during setup

@Column(name = "pending_two_factor_created_at")
private LocalDateTime pendingTwoFactorCreatedAt;
```

**Getters and Setters** for all new fields.

---

## DTOs (Data Transfer Objects)

### 1. TotpStartResponse.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/twofactor/TotpStartResponse.java`

```java
package com.secrets.dto.twofactor;

public class TotpStartResponse {
    private String qrCodeDataUrl; // Base64 encoded QR code image
    private String manualSecret; // Base32 secret for manual entry
    private String otpauthUrl; // Full otpauth:// URL

    // Constructors
    public TotpStartResponse() {}

    public TotpStartResponse(String qrCodeDataUrl, String manualSecret, String otpauthUrl) {
        this.qrCodeDataUrl = qrCodeDataUrl;
        this.manualSecret = manualSecret;
        this.otpauthUrl = otpauthUrl;
    }

    // Getters and Setters
    public String getQrCodeDataUrl() { return qrCodeDataUrl; }
    public void setQrCodeDataUrl(String qrCodeDataUrl) { this.qrCodeDataUrl = qrCodeDataUrl; }

    public String getManualSecret() { return manualSecret; }
    public void setManualSecret(String manualSecret) { this.manualSecret = manualSecret; }

    public String getOtpauthUrl() { return otpauthUrl; }
    public void setOtpauthUrl(String otpauthUrl) { this.otpauthUrl = otpauthUrl; }
}
```

### 2. TotpConfirmRequest.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/twofactor/TotpConfirmRequest.java`

```java
package com.secrets.dto.twofactor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class TotpConfirmRequest {
    @NotBlank(message = "Code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Code must be 6 digits")
    private String code;

    public TotpConfirmRequest() {}

    public TotpConfirmRequest(String code) {
        this.code = code;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
```

### 3. TotpConfirmResponse.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/twofactor/TotpConfirmResponse.java`

```java
package com.secrets.dto.twofactor;

import java.util.List;

public class TotpConfirmResponse {
    private boolean twoFactorEnabled;
    private List<String> recoveryCodes; // Plain text, shown only once

    public TotpConfirmResponse() {}

    public TotpConfirmResponse(boolean twoFactorEnabled, List<String> recoveryCodes) {
        this.twoFactorEnabled = twoFactorEnabled;
        this.recoveryCodes = recoveryCodes;
    }

    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) { 
        this.twoFactorEnabled = twoFactorEnabled; 
    }

    public List<String> recoveryCodes() { return recoveryCodes; }
    public void setRecoveryCodes(List<String> recoveryCodes) { 
        this.recoveryCodes = recoveryCodes; 
    }
}
```

### 4. TotpVerifyLoginRequest.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/twofactor/TotpVerifyLoginRequest.java`

```java
package com.secrets.dto.twofactor;

import jakarta.validation.constraints.NotBlank;

public class TotpVerifyLoginRequest {
    @NotBlank(message = "Intermediate token is required")
    private String intermediateToken;

    @NotBlank(message = "Code is required")
    private String code; // TOTP code or recovery code

    public TotpVerifyLoginRequest() {}

    public TotpVerifyLoginRequest(String intermediateToken, String code) {
        this.intermediateToken = intermediateToken;
        this.code = code;
    }

    public String getIntermediateToken() { return intermediateToken; }
    public void setIntermediateToken(String intermediateToken) { 
        this.intermediateToken = intermediateToken; 
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
```

### 5. TwoFactorDisableRequest.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/twofactor/TwoFactorDisableRequest.java`

```java
package com.secrets.dto.twofactor;

import jakarta.validation.constraints.NotBlank;

public class TwoFactorDisableRequest {
    @NotBlank(message = "Code or recovery code is required")
    private String code; // TOTP code or recovery code

    public TwoFactorDisableRequest() {}

    public TwoFactorDisableRequest(String code) {
        this.code = code;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
```

### 6. RecoveryCodesResponse.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/twofactor/RecoveryCodesResponse.java`

```java
package com.secrets.dto.twofactor;

import java.util.List;

public class RecoveryCodesResponse {
    private List<String> recoveryCodes; // Plain text, shown only once

    public RecoveryCodesResponse() {}

    public RecoveryCodesResponse(List<String> recoveryCodes) {
        this.recoveryCodes = recoveryCodes;
    }

    public List<String> getRecoveryCodes() { return recoveryCodes; }
    public void setRecoveryCodes(List<String> recoveryCodes) { 
        this.recoveryCodes = recoveryCodes; 
    }
}
```

### 7. Updated TokenResponse.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/TokenResponse.java`

Add the following fields:

```java
private Boolean requiresTwoFactor; // true if 2FA is required
private String intermediateToken; // Short-lived token for 2FA step
private String twoFactorType; // "TOTP"

// In builder:
public TokenResponseBuilder requiresTwoFactor(Boolean requiresTwoFactor) {
    this.requiresTwoFactor = requiresTwoFactor;
    return this;
}

public TokenResponseBuilder intermediateToken(String intermediateToken) {
    this.intermediateToken = intermediateToken;
    return this;
}

public TokenResponseBuilder twoFactorType(String twoFactorType) {
    this.twoFactorType = twoFactorType;
    return this;
}
```

### 8. Updated UserResponse.java

**Path:** `apps/backend/secret-service/src/main/java/com/secrets/dto/UserResponse.java`

Add:

```java
private Boolean twoFactorEnabled;
private String twoFactorType;

// In builder:
public UserResponseBuilder twoFactorEnabled(Boolean twoFactorEnabled) {
    this.twoFactorEnabled = twoFactorEnabled;
    return this;
}

public UserResponseBuilder twoFactorType(String twoFactorType) {
    this.twoFactorType = twoFactorType;
    return this;
}
```

---

## API Endpoints

### Base Path: `/api/auth/2fa`

All endpoints require authentication (JWT) unless otherwise specified.

---

### 1. Start TOTP Setup

**Endpoint:** `POST /api/auth/2fa/totp/start`

**Authentication:** Required (JWT)

**Description:** Initiates TOTP setup by generating a secret and QR code.

**Request:** None (user ID from JWT)

**Response:** `200 OK`

```json
{
  "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "manualSecret": "JBSWY3DPEHPK3PXP",
  "otpauthUrl": "otpauth://totp/Cloud%20Secrets%20Manager:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Cloud%20Secrets%20Manager&digits=6&period=30"
}
```

**Error Responses:**
- `400 Bad Request`: 2FA already enabled
- `401 Unauthorized`: Invalid or missing JWT
- `500 Internal Server Error`: Failed to generate secret

**Implementation Notes:**
- Generate random 160-bit secret (Base32 encoded)
- Store in `pending_two_factor_secret` with timestamp
- Generate QR code using otpauth URL
- Return all data needed for frontend to display QR

---

### 2. Confirm TOTP Setup

**Endpoint:** `POST /api/auth/2fa/totp/confirm`

**Authentication:** Required (JWT)

**Description:** Verifies the TOTP code and enables 2FA.

**Request:**

```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

```json
{
  "twoFactorEnabled": true,
  "recoveryCodes": [
    "ABCD-1234-EFGH",
    "IJKL-5678-MNOP",
    "QRST-9012-UVWX",
    "YZAB-3456-CDEF",
    "GHIJ-7890-KLMN",
    "OPQR-2345-STUV",
    "WXYZ-6789-ABCD",
    "EFGH-0123-IJKL",
    "MNOP-4567-QRST",
    "UVWX-8901-YZAB"
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Invalid code format, no pending setup, or code verification failed
- `401 Unauthorized`: Invalid or missing JWT
- `429 Too Many Requests`: Too many verification attempts

**Implementation Notes:**
- Verify code against `pending_two_factor_secret`
- Allow time skew of ±1 step (30 seconds)
- Generate 10 recovery codes (8 characters each, hyphenated)
- Hash recovery codes before storing
- Move secret from pending to `two_factor_secret` (encrypted)
- Set `two_factor_enabled = true`, `two_factor_type = 'TOTP'`
- Clear pending secret

---

### 3. Verify TOTP During Login

**Endpoint:** `POST /api/auth/2fa/totp/verify-login`

**Authentication:** Not required (uses intermediate token)

**Description:** Completes login by verifying TOTP code or recovery code.

**Request:**

```json
{
  "intermediateToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "123456"
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Error Responses:**
- `400 Bad Request`: Invalid code format or invalid intermediate token
- `401 Unauthorized`: Invalid intermediate token, expired token, or code verification failed
- `429 Too Many Requests`: Too many verification attempts

**Implementation Notes:**
- Validate intermediate token (signature + expiry)
- Extract user ID from token
- Check if code is TOTP (6 digits) or recovery code (format: `XXXX-XXXX-XXXX`)
- If TOTP: verify against user's `two_factor_secret`
- If recovery code: verify against hashed recovery codes, mark as used
- On success: issue full access + refresh tokens
- Update `two_factor_last_verified_at`
- Rate limit: 5 attempts per 5 minutes per IP + user

---

### 4. Disable 2FA

**Endpoint:** `POST /api/auth/2fa/disable`

**Authentication:** Required (JWT)

**Description:** Disables 2FA after verifying TOTP code or recovery code.

**Request:**

```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

```json
{
  "message": "Two-factor authentication has been disabled",
  "twoFactorEnabled": false
}
```

**Error Responses:**
- `400 Bad Request`: Invalid code format or code verification failed
- `401 Unauthorized`: Invalid or missing JWT, or 2FA not enabled
- `429 Too Many Requests`: Too many verification attempts

**Implementation Notes:**
- Require TOTP code or recovery code
- Verify code
- Set `two_factor_enabled = false`
- Clear `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_type`
- Clear `two_factor_enabled_at`, `two_factor_last_verified_at`

---

### 5. Regenerate Recovery Codes

**Endpoint:** `POST /api/auth/2fa/recovery-codes/regenerate`

**Authentication:** Required (JWT)

**Description:** Generates new recovery codes, invalidating old ones.

**Request:** None (user ID from JWT)

**Response:** `200 OK`

```json
{
  "recoveryCodes": [
    "ABCD-1234-EFGH",
    "IJKL-5678-MNOP",
    ...
  ]
}
```

**Error Responses:**
- `400 Bad Request`: 2FA not enabled
- `401 Unauthorized`: Invalid or missing JWT

**Implementation Notes:**
- Require re-authentication (password or TOTP) - can be handled via separate endpoint or middleware
- Generate 10 new recovery codes
- Hash and store new codes
- Clear old recovery codes
- Return plain text codes (shown only once)

---

### 6. Updated Login Endpoint

**Endpoint:** `POST /api/auth/login` (existing)

**Changes:** Modify response when user has 2FA enabled.

**Response (2FA Required):**

```json
{
  "requiresTwoFactor": true,
  "intermediateToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "twoFactorType": "TOTP",
  "expiresIn": 300
}
```

**Response (No 2FA):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "requiresTwoFactor": false
}
```

**Implementation Notes:**
- After successful username/password authentication:
  - Check if user has `two_factor_enabled = true`
  - If yes: generate intermediate token (5-10 min expiry), return 2FA required response
  - If no: proceed with normal token generation

---

## Security Considerations

### 1. Secret Encryption

- **Encrypt `two_factor_secret` at rest** using AES-256-GCM
- Use encryption key from environment variable or GCP Secret Manager
- Never log secrets or codes

### 2. Intermediate Token

- **Short expiry**: 5-10 minutes
- **Signed JWT** with same secret as access tokens
- **Claims**: `userId`, `requiresTwoFactor: true`, `exp`
- **Single use**: Consider invalidating after successful 2FA verification

### 3. Recovery Codes

- **Hash before storage** using bcrypt or Argon2
- **One-time use**: Mark as used after verification
- **Plain text shown only once** during setup/regeneration

### 4. Rate Limiting

- **TOTP verification**: 5 attempts per 5 minutes per IP + user
- **Recovery code attempts**: 3 attempts per 15 minutes per IP + user
- Return generic error messages ("Invalid code") to prevent enumeration

### 5. Time Skew

- Allow **±1 time step** (30 seconds) for TOTP verification
- Handle clock drift gracefully

### 6. Audit Logging

- Log all 2FA events:
  - `TWO_FACTOR_ENABLED`
  - `TWO_FACTOR_DISABLED`
  - `TWO_FACTOR_VERIFIED` (successful login)
  - `TWO_FACTOR_VERIFICATION_FAILED`
  - `RECOVERY_CODE_USED`
  - `RECOVERY_CODES_REGENERATED`

---

## Implementation Checklist

### Phase 1: Database & Entity

- [ ] Create migration script `V9__add_two_factor_authentication.sql`
- [ ] Update `User.java` entity with new fields
- [ ] Add getters/setters for all new fields
- [ ] Test migration on dev database

### Phase 2: Dependencies & Utilities

- [ ] Add TOTP library to `pom.xml`:
  ```xml
  <dependency>
      <groupId>com.eatthepath</groupId>
      <artifactId>java-otp</artifactId>
      <version>0.4.0</version>
  </dependency>
  ```
- [ ] Add QR code generation library:
  ```xml
  <dependency>
      <groupId>com.google.zxing</groupId>
      <artifactId>core</artifactId>
      <version>3.5.2</version>
  </dependency>
  <dependency>
      <groupId>com.google.zxing</groupId>
      <artifactId>javase</artifactId>
      <version>3.5.2</version>
  </dependency>
  ```
- [ ] Create `TwoFactorService.java` with:
  - TOTP secret generation
  - TOTP code verification
  - QR code generation
  - Recovery code generation/hashing/verification
  - Secret encryption/decryption
- [ ] Create `IntermediateTokenProvider.java` for generating/validating intermediate tokens

### Phase 3: DTOs

- [ ] Create all DTOs listed in [DTOs section](#dtos-data-transfer-objects)
- [ ] Update `TokenResponse.java` with 2FA fields
- [ ] Update `UserResponse.java` with 2FA fields

### Phase 4: Controllers

- [ ] Create `TwoFactorController.java` with all endpoints
- [ ] Update `AuthController.java` login endpoint to check 2FA
- [ ] Add rate limiting annotations
- [ ] Add proper error handling

### Phase 5: Service Layer

- [ ] Implement `TwoFactorService` methods
- [ ] Update `UserService` to handle 2FA fields
- [ ] Add encryption service for secrets
- [ ] Integrate with audit service for logging

### Phase 6: Security & Configuration

- [ ] Add environment variables for:
  - `TOTP_ISSUER`
  - `TOTP_PERIOD` (default: 30)
  - `TOTP_DIGITS` (default: 6)
  - `TOTP_SKEW` (default: 1)
  - `TWO_FACTOR_ENCRYPTION_KEY`
  - `INTERMEDIATE_TOKEN_EXPIRY_MS` (default: 300000)
- [ ] Configure rate limiting
- [ ] Add security tests

### Phase 7: Frontend (Separate Task)

- [ ] Update TypeScript types
- [ ] Create 2FA setup UI in Settings
- [ ] Update login flow for 2FA step
- [ ] Add recovery code display/download
- [ ] Add disable 2FA flow

### Phase 8: Testing

- [ ] Unit tests for `TwoFactorService`
- [ ] Integration tests for all endpoints
- [ ] Test time skew handling
- [ ] Test rate limiting
- [ ] Test recovery code flow
- [ ] Manual end-to-end testing

### Phase 9: Documentation

- [ ] Update API documentation (Swagger)
- [ ] Update `TECHNICAL_DOCUMENTATION.md`
- [ ] Create user guide for 2FA setup
- [ ] Update deployment docs with new env vars

---

## Configuration Example

### application.yml

```yaml
two-factor:
  totp:
    issuer: "Cloud Secrets Manager"
    period: 30
    digits: 6
    skew: 1
  encryption:
    key: ${TWO_FACTOR_ENCRYPTION_KEY:} # From env or Secret Manager
  intermediate-token:
    expiry-ms: 300000 # 5 minutes
  rate-limit:
    totp-attempts: 5
    totp-window-minutes: 5
    recovery-attempts: 3
    recovery-window-minutes: 15
```

---

## Next Steps

1. **Review this design** with the team
2. **Create feature branch**: `feature/two-factor-authentication`
3. **Start with Phase 1** (Database & Entity)
4. **Implement incrementally** following the checklist
5. **Test thoroughly** before merging

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025

