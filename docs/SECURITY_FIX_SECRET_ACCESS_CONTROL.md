# Critical Security Fix: Secret Access Control

## 🚨 **CRITICAL SECURITY VULNERABILITY FIXED**

### **Issue Discovered**
Regular users could see **ALL secrets** in the system, including secrets created by admins and other users. This was a critical security vulnerability.

### **Root Cause**
The `listSecrets()` method in `SecretService.java` was calling `secretRepository.findAll()` for regular users without filtering by ownership or sharing. This returned all secrets in the database regardless of who created them.

### **Affected Endpoints**
1. **`GET /api/secrets`** - List all secrets (CRITICAL)
2. **`GET /api/secrets/expired`** - List expired secrets
3. **`GET /api/secrets/expiring-soon`** - List secrets expiring soon
4. **Search functionality** - Keyword searches returned all matching secrets

### **Security Impact**
- **Severity**: CRITICAL
- **Impact**: Any authenticated user with READ permission could see all secrets in the system
- **Data Exposure**: All secret keys, metadata, and potentially sensitive information

---

## ✅ **Fixes Applied**

### **1. Fixed `listSecrets()` Method**
**File**: `apps/backend/secret-service/src/main/java/com/secrets/service/SecretService.java`

**Changes**:
- Added user access filtering for non-admin users
- Non-admin users now only see:
  - Secrets they created (`createdBy = username`)
  - Secrets shared with them (via `SharedSecret` table)
- Admins continue to see all secrets

**New Logic**:
```java
if (isAdmin) {
    // Admins see all secrets
    secrets = secretRepository.findAll(pageable);
} else {
    // Regular users see only accessible secrets
    secrets = secretRepository.findAccessibleSecrets(username, pageable);
}
```

### **2. Added New Repository Queries**
**File**: `apps/backend/secret-service/src/main/java/com/secrets/repository/SecretRepository.java`

**New Queries**:
- `findAccessibleSecrets()` - Finds secrets owned by user OR shared with user
- `searchAccessibleSecrets()` - Searches accessible secrets with keyword filter
- `findExpiredSecretsForUser()` - Finds expired secrets accessible to user
- `findSecretsExpiringBetweenForUser()` - Finds expiring secrets accessible to user

**Query Example**:
```sql
SELECT DISTINCT s FROM Secret s 
LEFT JOIN SharedSecret ss ON s.secretKey = ss.secretKey 
WHERE (s.createdBy = :username OR ss.sharedWith = :username)
```

### **3. Fixed Expired Secrets Endpoint**
**File**: `apps/backend/secret-service/src/main/java/com/secrets/service/SecretExpirationService.java`

**Changes**:
- `getExpiredSecrets()` now accepts `username` and `isAdmin` parameters
- Filters results for non-admin users

### **4. Fixed Expiring Soon Endpoint**
**File**: `apps/backend/secret-service/src/main/java/com/secrets/service/SecretExpirationService.java`

**Changes**:
- `getSecretsExpiringSoon()` now accepts `username` and `isAdmin` parameters
- Filters results for non-admin users

### **5. Updated Controller Endpoints**
**File**: `apps/backend/secret-service/src/main/java/com/secrets/controller/SecretController.java`

**Changes**:
- Updated `/expired` endpoint to pass user context
- Updated `/expiring-soon` endpoint to pass user context
- Added proper logging for access control

---

## 🔒 **Security Model (After Fix)**

### **Admin Users**
- Can see **all secrets** in the system
- Can filter by any creator
- Can search across all secrets
- Can see all expired/expiring secrets

### **Regular Users**
- Can see **only**:
  - Secrets they created
  - Secrets shared with them (via sharing feature)
- Cannot filter by other users' usernames
- Search only returns accessible secrets
- Expired/expiring endpoints only return accessible secrets

### **Access Control Matrix**

| Operation | Admin | Regular User |
|-----------|-------|--------------|
| List all secrets | ✅ All | ❌ Only owned + shared |
| Search secrets | ✅ All | ❌ Only accessible |
| Filter by creator | ✅ Any user | ❌ Only self |
| View expired | ✅ All | ❌ Only accessible |
| View expiring soon | ✅ All | ❌ Only accessible |
| Get secret by key | ✅ Any | ✅ If owned or shared |
| Create secret | ✅ Yes | ✅ Yes (if has WRITE) |
| Update secret | ✅ Any | ✅ Only if owned or shared |
| Delete secret | ✅ Any | ✅ Only if owned |

---

## 🧪 **Testing Recommendations**

### **Test Cases to Verify**

1. **Regular User List Test**
   - Create secrets as admin
   - Create secrets as regular user
   - Login as regular user
   - Call `GET /api/secrets`
   - **Expected**: Only see own secrets + shared secrets
   - **Before Fix**: Would see all secrets ❌
   - **After Fix**: Only accessible secrets ✅

2. **Search Test**
   - Admin creates secret with keyword "test"
   - Regular user creates secret with keyword "test"
   - Regular user searches for "test"
   - **Expected**: Only see own "test" secret
   - **Before Fix**: Would see both ❌
   - **After Fix**: Only own secret ✅

3. **Expired Secrets Test**
   - Admin creates expired secret
   - Regular user creates expired secret
   - Regular user calls `GET /api/secrets/expired`
   - **Expected**: Only see own expired secret
   - **Before Fix**: Would see both ❌
   - **After Fix**: Only own expired secret ✅

4. **Shared Secret Test**
   - Admin creates secret and shares with regular user
   - Regular user calls `GET /api/secrets`
   - **Expected**: See shared secret in list
   - **Status**: Should work correctly ✅

---

## 📝 **Files Modified**

1. `apps/backend/secret-service/src/main/java/com/secrets/repository/SecretRepository.java`
   - Added 4 new repository queries for user-scoped access

2. `apps/backend/secret-service/src/main/java/com/secrets/service/SecretService.java`
   - Fixed `listSecrets()` method to filter by user access
   - Added admin vs regular user logic

3. `apps/backend/secret-service/src/main/java/com/secrets/service/SecretExpirationService.java`
   - Updated `getExpiredSecrets()` to accept user context
   - Updated `getSecretsExpiringSoon()` to accept user context

4. `apps/backend/secret-service/src/main/java/com/secrets/controller/SecretController.java`
   - Updated expired and expiring-soon endpoints to pass user context

---

## ⚠️ **Important Notes**

1. **Backward Compatibility**: This is a breaking change for any clients expecting to see all secrets. However, this is the **correct security behavior**.

2. **Performance**: The new queries use `LEFT JOIN` which may have performance implications with large datasets. Consider adding indexes if needed:
   - Index on `SharedSecret.secretKey`
   - Index on `SharedSecret.sharedWith`
   - Index on `Secret.createdBy`

3. **Migration**: No database migration needed - this is a code-level fix.

4. **Audit**: All access is still logged via the audit service, so you can track who accessed what.

---

## ✅ **Verification Steps**

After deploying this fix:

1. **Restart the backend service**
2. **Test as regular user**:
   - Login with a non-admin account
   - Call `GET /api/secrets`
   - Verify you only see your own secrets
3. **Test as admin**:
   - Login with admin account
   - Call `GET /api/secrets`
   - Verify you see all secrets
4. **Test sharing**:
   - Admin shares a secret with regular user
   - Regular user should see it in their list

---

## 🔍 **Additional Security Recommendations**

1. **Review all other endpoints** for similar issues
2. **Add integration tests** for access control
3. **Consider adding rate limiting** on list endpoints
4. **Monitor audit logs** for suspicious access patterns
5. **Review frontend** to ensure it doesn't cache all secrets

---

**Date Fixed**: 2025-01-23
**Severity**: CRITICAL
**Status**: ✅ FIXED

