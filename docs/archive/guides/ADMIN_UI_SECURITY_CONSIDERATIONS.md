# Admin UI Security Considerations

**Why You Should NOT Create a Frontend Admin UI for User Management**

**Date:** November 23, 2025  
**Status:** ✅ Recommended Best Practice  
**Applies To:** Cloud Secrets Manager & Google Cloud Identity Platform Integration

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Risks](#security-risks)
3. [Why Google Console is Better](#why-google-console-is-better)
4. [Architecture Principles](#architecture-principles)
5. [What Belongs in Frontend](#what-belongs-in-frontend)
6. [Secure Alternatives](#secure-alternatives)
7. [Real-World Examples](#real-world-examples)
8. [Implementation Guide](#implementation-guide)

---

## Executive Summary

### **Recommendation: DO NOT Create Frontend Admin UI**

**Instead:**
- ✅ Use Google Cloud Console for manual user management
- ✅ Use Backend Admin SDK for automation
- ✅ Use CLI tools for operational tasks
- ❌ DO NOT expose admin operations to frontend

**Why:**
- **Security**: Frontend is attack surface, admin operations are high-value targets
- **Best Practice**: Separation of admin plane from user plane
- **Maintenance**: Google maintains secure console, you maintain nothing
- **Compliance**: Better audit trails and access controls

---

## Security Risks

### 1. **High-Value Attack Target** 🎯

**Risk Level:** 🔴 CRITICAL

Frontend admin UI exposes privileged operations to the internet:

```
Public Internet
    ↓
Frontend Admin UI (React)
    ↓
Admin API Endpoints
    ↓
User Database (Create, Delete, Modify Roles)
```

**Attack Scenarios:**

#### **A. XSS (Cross-Site Scripting)**

```javascript
// Attacker injects malicious script
<script>
  // Elevate own privileges
  fetch('/api/admin/users/me/role', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + stolenToken },
    body: JSON.stringify({ role: 'ADMIN' })
  });
  
  // Create backdoor admin account
  fetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: 'attacker@evil.com',
      role: 'ADMIN',
      permissions: ['ALL']
    })
  });
</script>
```

**Impact:**
- Attacker gains full admin access
- Can create unlimited admin accounts
- Can delete all users
- Can modify any user's permissions
- Complete system compromise

---

#### **B. CSRF (Cross-Site Request Forgery)**

```html
<!-- Attacker hosts this on evil.com -->
<img src="https://your-app.com/api/admin/users/delete?id=123" />

<!-- Or uses form auto-submit -->
<form action="https://your-app.com/api/admin/users" method="POST">
  <input name="email" value="attacker@evil.com" />
  <input name="role" value="ADMIN" />
</form>
<script>document.forms[0].submit();</script>
```

**Impact:**
- Admin unknowingly creates attacker account
- Admin unknowingly deletes legitimate users
- Admin unknowingly elevates attacker's privileges

---

#### **C. Session Hijacking**

```javascript
// Attacker steals admin session token
document.cookie;
localStorage.getItem('adminToken');
sessionStorage.getItem('accessToken');

// Uses stolen token to perform admin operations
fetch('/api/admin/users', {
  headers: { 'Authorization': 'Bearer ' + stolenAdminToken }
});
```

**Impact:**
- Full admin access with stolen token
- Can perform any admin operation
- Hard to detect (looks like legitimate admin)

---

#### **D. Client-Side Bypass**

```javascript
// User modifies React code in browser DevTools
// Changes role check from:
if (user.role === 'ADMIN') {
  showAdminUI();
}

// To:
if (true) {
  showAdminUI();
}

// Or directly calls admin API
fetch('/api/admin/users', {
  method: 'POST',
  body: JSON.stringify({ email: 'me@me.com', role: 'ADMIN' })
});
```

**Impact:**
- Non-admin users access admin UI
- Can attempt admin operations
- If backend validation weak, succeeds

---

### 2. **Inadequate Access Control** 🔓

**Common Mistakes:**

```typescript
// ❌ BAD: Only checking on frontend
function AdminPanel() {
  const { user } = useAuth();
  
  // Client-side check only - can be bypassed!
  if (user.role !== 'ADMIN') {
    return <div>Access Denied</div>;
  }
  
  return <AdminControls />;
}

// ❌ BAD: Weak backend validation
@PostMapping("/api/admin/users")
public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
  // No authentication check!
  // No authorization check!
  userService.createUser(request);
  return ResponseEntity.ok().build();
}

// ❌ BAD: Token in URL
fetch(`/api/admin/users?token=${adminToken}`);
// Token leaked in browser history, logs, analytics
```

---

### 3. **Privilege Escalation** ⬆️

**Attack Path:**

```
1. Regular User → Discovers admin endpoint (e.g., /api/admin/users)
2. Attempts to call it with own token
3. Backend has weak role check
4. Successfully creates admin account
5. Logs in as new admin
6. Full system access
```

**Code Example:**

```typescript
// ❌ BAD: Insufficient privilege check
@PutMapping("/api/users/{id}/role")
public ResponseEntity<?> updateUserRole(
    @PathVariable Long id,
    @RequestBody RoleRequest request
) {
  // Only checks if authenticated, not if admin!
  User user = userService.updateRole(id, request.getRole());
  return ResponseEntity.ok(user);
}

// User can change own role to ADMIN!
PUT /api/users/123/role
{ "role": "ADMIN" }
```

---

### 4. **Audit Trail Issues** 📝

**Problems with Frontend Admin UI:**

- Hard to track who performed what action
- Frontend logs unreliable (can be manipulated)
- IP addresses can be spoofed
- User agents can be faked
- No guarantee of logging (frontend can be modified)

**Example:**

```typescript
// Frontend logging (unreliable)
function deleteUser(userId) {
  // Can be removed by attacker
  auditLog.record('DELETE_USER', userId);
  
  await api.delete(`/api/admin/users/${userId}`);
}

// Attacker just removes logging:
function deleteUser(userId) {
  await api.delete(`/api/admin/users/${userId}`);
}
```

---

### 5. **Compliance Violations** ⚖️

**SOC 2, ISO 27001, GDPR Requirements:**

- ✅ **Separation of duties**: Admin operations separate from user operations
- ✅ **Audit logging**: All admin actions logged immutably
- ✅ **Access control**: Strong authentication for admin operations
- ✅ **Data protection**: Limit exposure of user data

**Frontend Admin UI violates:**
- ❌ Exposes admin operations to public internet
- ❌ Weaker audit trail
- ❌ Higher risk of data breach
- ❌ Harder to prove compliance

---

## Why Google Console is Better

### **Google Cloud Console Benefits**

```
┌─────────────────────────────────────────────────────────┐
│        Google Cloud Console (Secure Admin Plane)        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ✅ IAM-based access control                             │
│  ✅ MFA required for sensitive operations                │
│  ✅ Audit logs automatically (Cloud Audit Logs)          │
│  ✅ IP-based access restrictions                         │
│  ✅ Service account key rotation                         │
│  ✅ Fine-grained permissions (IAM roles)                 │
│  ✅ Session timeout & re-authentication                  │
│  ✅ Security updates by Google                           │
│  ✅ DDoS protection                                       │
│  ✅ Rate limiting built-in                               │
│  ✅ Compliance certifications (SOC 2, ISO 27001, etc.)   │
│  ✅ Geographic restrictions                              │
│  ✅ Anomaly detection                                     │
│  ✅ Zero maintenance cost for you                        │
└─────────────────────────────────────────────────────────┘
```

### **Comparison Table**

| Feature | Frontend Admin UI | Google Cloud Console |
|---------|-------------------|---------------------|
| **Security** | ❌ Exposed to internet | ✅ Google-grade security |
| **Authentication** | ⚠️ JWT tokens | ✅ Google accounts + MFA |
| **Authorization** | ⚠️ Custom RBAC | ✅ IAM roles & policies |
| **Audit Logs** | ⚠️ Custom implementation | ✅ Cloud Audit Logs |
| **Attack Surface** | ❌ High (public web) | ✅ Low (restricted access) |
| **Compliance** | ⚠️ You prove it | ✅ Google certified |
| **Maintenance** | ❌ You maintain | ✅ Google maintains |
| **Cost** | ❌ Development time | ✅ Free (included) |
| **DDoS Protection** | ⚠️ DIY | ✅ Google Cloud Armor |
| **Rate Limiting** | ⚠️ DIY | ✅ Built-in |
| **IP Restrictions** | ⚠️ DIY | ✅ Built-in |
| **MFA** | ⚠️ DIY | ✅ Built-in |
| **Anomaly Detection** | ❌ None | ✅ Built-in |
| **Updates** | ❌ Manual | ✅ Automatic |

---

## Architecture Principles

### **Principle 1: Separation of Planes**

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN PLANE                           │
│              (Internal, Highly Restricted)               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  • Google Cloud Console                                  │
│  • gcloud CLI                                            │
│  • Backend Admin SDK                                     │
│  • Service account access only                          │
│  • Internal network only                                │
│  • MFA required                                          │
│  • Full audit logging                                   │
│                                                           │
│  Operations:                                             │
│  ├── Create users                                       │
│  ├── Delete users                                       │
│  ├── Modify roles                                       │
│  ├── Set permissions                                    │
│  ├── View all users                                     │
│  └── Manage service accounts                           │
└─────────────────────────────────────────────────────────┘

            ❌ NO CONNECTION TO USER PLANE

┌─────────────────────────────────────────────────────────┐
│                    USER PLANE                            │
│              (Public, User Operations Only)              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  • React Frontend                                        │
│  • Public API                                            │
│  • User authentication                                   │
│  • User operations only                                 │
│                                                           │
│  Operations:                                             │
│  ├── Login/Logout                                       │
│  ├── View own profile                                   │
│  ├── Change own password                                │
│  ├── Manage own secrets                                 │
│  └── Share secrets with others                         │
└─────────────────────────────────────────────────────────┘
```

---

### **Principle 2: Least Privilege**

```typescript
// ✅ GOOD: Users can only manage their own data
@GetMapping("/api/v1/users/me")
public ResponseEntity<User> getMyProfile() {
  User user = getCurrentUser();
  return ResponseEntity.ok(user);
}

@PutMapping("/api/v1/users/me/password")
public ResponseEntity<?> changeMyPassword(@RequestBody PasswordChangeRequest request) {
  User user = getCurrentUser();
  userService.changePassword(user, request);
  return ResponseEntity.ok().build();
}

// ❌ BAD: Users can access other users' data
@GetMapping("/api/v1/users/{id}")
public ResponseEntity<User> getUser(@PathVariable Long id) {
  // Any user can view any other user!
  User user = userService.findById(id);
  return ResponseEntity.ok(user);
}
```

---

### **Principle 3: Defense in Depth**

**Multiple layers of security:**

```
Layer 1: Network (VPC, Firewall)
    ↓
Layer 2: Authentication (Google Identity Platform)
    ↓
Layer 3: Authorization (IAM Roles)
    ↓
Layer 4: Application (Backend validation)
    ↓
Layer 5: Data (Encryption at rest)
    ↓
Layer 6: Audit (Cloud Audit Logs)
```

**Frontend Admin UI weakens this:**
- Exposes layers to internet
- Single point of failure
- Harder to secure

---

## What Belongs in Frontend

### **✅ Allowed in Frontend**

```typescript
// 1. User login/logout
<LoginForm />
<LogoutButton />

// 2. View own profile
<MyProfile user={currentUser} />

// 3. Change own password
<ChangePasswordForm />

// 4. Manage own secrets
<SecretList userSecrets={mySecrets} />
<CreateSecretForm />

// 5. Share secrets with others (limited user search)
<ShareSecretModal>
  <UserSearch /> {/* Only returns emails */}
</ShareSecretModal>

// 6. Request password reset
<ForgotPasswordForm />

// 7. Enable MFA (for own account)
<EnableMFAButton />
```

---

### **❌ NOT Allowed in Frontend**

```typescript
// 1. Create other users
<CreateUserForm /> // ❌ NO

// 2. Delete other users
<DeleteUserButton userId={123} /> // ❌ NO

// 3. Modify other users' roles
<ChangeRoleForm userId={123} /> // ❌ NO

// 4. View all users with details
<UserList> // ❌ NO (except emails for sharing)
  <UserRow>
    <Role>ADMIN</Role> // ❌ Security risk
    <Permissions>READ,WRITE</Permissions> // ❌ Security risk
    <LastLogin>2 hours ago</LastLogin> // ❌ Privacy issue
  </UserRow>
</UserList>

// 5. Manage permissions
<PermissionsEditor userId={123} /> // ❌ NO

// 6. Disable/enable accounts
<DisableAccountButton /> // ❌ NO

// 7. View other users' audit logs
<AuditLogViewer userId={123} /> // ❌ NO
```

---

### **⚠️ Limited/Restricted in Frontend**

```typescript
// User search for sharing (minimal data only)
<UserSearchForSharing
  onSelect={(email) => shareSecret(email)}
>
  {/* Only shows email addresses */}
  <SearchResult email="user@example.com" />
  {/* NO roles, permissions, or other data */}
</UserSearchForSharing>

// View own audit logs only
<MyAuditLogs userId={currentUser.id} />
// Cannot view other users' logs
```

---

## Secure Alternatives

### **Alternative 1: Google Cloud Console** ⭐ **RECOMMENDED**

**Access:** https://console.firebase.google.com

**Features:**
- User management (create, edit, delete)
- Set custom claims (roles/permissions)
- View authentication statistics
- Configure sign-in methods
- Email templates
- Security rules
- Usage quotas
- Audit logs

**How to use:**

```
1. Open Firebase Console
2. Select your project
3. Navigate to Authentication > Users
4. Click "Add user"
5. Enter email and password
6. User created!

7. To set role (use Admin SDK):
   gcloud functions deploy setUserRole --trigger-http
```

**Security:**
- ✅ Requires Google account authentication
- ✅ IAM permissions required
- ✅ MFA can be enforced
- ✅ IP restrictions possible
- ✅ Full audit trail in Cloud Audit Logs
- ✅ No development/maintenance cost

---

### **Alternative 2: Backend Admin SDK** ⭐ **For Automation**

**Use Case:** Programmatic user creation (e.g., bulk import, provisioning)

**Implementation:**

```java
// AdminUserService.java
@Service
public class AdminUserService {
    
    @Autowired
    private FirebaseAuth firebaseAuth;
    
    /**
     * Create user - BACKEND ONLY, NOT EXPOSED TO FRONTEND
     */
    public String createUser(CreateUserRequest request) throws FirebaseAuthException {
        // Create user in Google Identity Platform
        UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
            .setEmail(request.getEmail())
            .setPassword(request.getPassword())
            .setEmailVerified(false)
            .setDisplayName(request.getDisplayName());
        
        UserRecord userRecord = firebaseAuth.createUser(createRequest);
        
        // Set custom claims (roles & permissions)
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", request.getRole());
        claims.put("permissions", request.getPermissions());
        claims.put("createdBy", "admin-service");
        claims.put("createdAt", System.currentTimeMillis());
        
        firebaseAuth.setCustomUserClaims(userRecord.getUid(), claims);
        
        // Log to audit
        auditService.log(AuditAction.USER_CREATED, userRecord.getUid(), request.getEmail());
        
        return userRecord.getUid();
    }
    
    /**
     * Update user role - BACKEND ONLY
     */
    public void updateUserRole(String uid, String role, List<String> permissions) 
            throws FirebaseAuthException {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("permissions", permissions);
        claims.put("updatedAt", System.currentTimeMillis());
        
        firebaseAuth.setCustomUserClaims(uid, claims);
        
        auditService.log(AuditAction.USER_ROLE_UPDATED, uid, role);
    }
    
    /**
     * Delete user - BACKEND ONLY
     */
    public void deleteUser(String uid) throws FirebaseAuthException {
        UserRecord user = firebaseAuth.getUser(uid);
        firebaseAuth.deleteUser(uid);
        
        auditService.log(AuditAction.USER_DELETED, uid, user.getEmail());
    }
}
```

**How to call securely:**

See Alternative 3 (CLI) or Alternative 4 (Internal API)

---

### **Alternative 3: CLI Tool** ⭐ **For Operations**

**Create a command-line admin tool:**

```java
// AdminCLI.java
@SpringBootApplication
public class AdminCLI implements CommandLineRunner {
    
    @Autowired
    private AdminUserService adminUserService;
    
    @Override
    public void run(String... args) throws Exception {
        if (args.length == 0) {
            printUsage();
            return;
        }
        
        String command = args[0];
        
        switch (command) {
            case "create-user":
                handleCreateUser(args);
                break;
            case "update-role":
                handleUpdateRole(args);
                break;
            case "delete-user":
                handleDeleteUser(args);
                break;
            case "list-users":
                handleListUsers();
                break;
            default:
                System.err.println("Unknown command: " + command);
                printUsage();
        }
        
        System.exit(0);
    }
    
    private void handleCreateUser(String[] args) {
        if (args.length < 4) {
            System.err.println("Usage: create-user <email> <password> <role>");
            return;
        }
        
        String email = args[1];
        String password = args[2];
        String role = args[3];
        
        try {
            CreateUserRequest request = new CreateUserRequest();
            request.setEmail(email);
            request.setPassword(password);
            request.setRole(role);
            request.setPermissions(getDefaultPermissions(role));
            
            String uid = adminUserService.createUser(request);
            System.out.println("✓ User created successfully!");
            System.out.println("  UID: " + uid);
            System.out.println("  Email: " + email);
            System.out.println("  Role: " + role);
        } catch (Exception e) {
            System.err.println("✗ Failed to create user: " + e.getMessage());
        }
    }
    
    private void printUsage() {
        System.out.println("Admin CLI - User Management");
        System.out.println();
        System.out.println("Commands:");
        System.out.println("  create-user <email> <password> <role>");
        System.out.println("  update-role <uid> <role>");
        System.out.println("  delete-user <uid>");
        System.out.println("  list-users");
        System.out.println();
        System.out.println("Roles: ADMIN, USER, VIEWER");
    }
}
```

**Usage:**

```bash
# Build CLI tool
./mvnw clean package -DskipTests

# Run commands
java -jar target/admin-cli.jar create-user user@example.com password123 USER
java -jar target/admin-cli.jar update-role abc123 ADMIN
java -jar target/admin-cli.jar delete-user abc123
java -jar target/admin-cli.jar list-users
```

**Security:**
- ✅ Requires direct server/console access
- ✅ Not exposed to internet
- ✅ IAM controls who can run
- ✅ Audit logs all operations
- ✅ Can enforce MFA at OS level

---

### **Alternative 4: Internal Admin API** ⚠️ **Use with Extreme Caution**

**Only if absolutely necessary for automation:**

```java
// InternalAdminController.java
@RestController
@RequestMapping("/api/internal/admin")
public class InternalAdminController {
    
    @Autowired
    private AdminUserService adminUserService;
    
    /**
     * INTERNAL ONLY - Not exposed to public internet
     * Requires service account authentication
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('SERVICE_ACCOUNT')")
    public ResponseEntity<?> createUser(
            @RequestBody CreateUserRequest request,
            @RequestHeader("X-Service-Account-Token") String serviceToken
    ) {
        // Verify service account token
        if (!serviceAccountService.validateToken(serviceToken)) {
            return ResponseEntity.status(403).body("Invalid service account token");
        }
        
        // Rate limiting (1 request per minute)
        if (!rateLimiter.tryAcquire()) {
            return ResponseEntity.status(429).body("Rate limit exceeded");
        }
        
        // Audit log
        auditService.logAdminOperation(
            "CREATE_USER",
            request.getEmail(),
            getServiceAccountId(serviceToken),
            request
        );
        
        // Create user
        try {
            String uid = adminUserService.createUser(request);
            return ResponseEntity.ok(Map.of("uid", uid));
        } catch (Exception e) {
            auditService.logAdminOperationFailure("CREATE_USER", e);
            return ResponseEntity.status(500).body("User creation failed");
        }
    }
}
```

**Security requirements:**

```yaml
# application-internal.yml
internal:
  admin:
    enabled: ${INTERNAL_ADMIN_ENABLED:false}
    allowed-ips:
      - 10.0.0.0/8      # Internal network only
      - 172.16.0.0/12   # Private network
    require-service-account: true
    rate-limit:
      requests-per-minute: 10
      burst: 20
    audit:
      log-all-requests: true
      alert-on-failure: true
```

**Firewall rules:**

```bash
# Only accessible from internal network
gcloud compute firewall-rules create allow-internal-admin \
  --allow tcp:8080 \
  --source-ranges 10.0.0.0/8 \
  --target-tags internal-admin \
  --description "Allow admin API from internal network only"
```

---

## Real-World Examples

### **How Major Companies Handle Admin Operations**

#### **1. GitHub**
```
✅ Admin operations: enterprise.github.com (separate domain)
✅ User operations: github.com
✅ No admin UI in main app
✅ CLI: gh api
```

#### **2. AWS**
```
✅ Admin operations: IAM Console (console.aws.amazon.com/iam)
✅ User operations: Application-specific
✅ CLI: aws iam create-user
✅ SDK: boto3, AWS SDK
```

#### **3. Google Workspace**
```
✅ Admin operations: admin.google.com
✅ User operations: mail.google.com, drive.google.com, etc.
✅ Complete separation
✅ Different authentication
```

#### **4. Stripe**
```
✅ Admin operations: dashboard.stripe.com
✅ User operations: Customer portals
✅ API keys for programmatic access
✅ Webhooks for automation
```

---

## Implementation Guide

### **Step 1: Disable Frontend Admin UI**

```typescript
// ❌ Remove these components
- src/pages/Admin.tsx
- src/components/AdminPanel.tsx
- src/components/UserManagement.tsx

// ❌ Remove these routes
<Route path="/admin" element={<AdminPage />} />
<Route path="/admin/users" element={<UserManagement />} />

// ❌ Remove these API endpoints
@PostMapping("/api/admin/users")
@DeleteMapping("/api/admin/users/{id}")
@PutMapping("/api/admin/users/{id}/role")
```

---

### **Step 2: Enable Google Cloud Console Access**

```bash
# 1. Grant IAM permissions to admins
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:admin@example.com" \
  --role="roles/firebase.admin"

# 2. Admin can now access Firebase Console
https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/users
```

---

### **Step 3: Create Backend Admin Service**

See "Alternative 2" above for full implementation.

---

### **Step 4: Create CLI Tool**

See "Alternative 3" above for full implementation.

---

### **Step 5: Document Admin Procedures**

```markdown
# Admin Procedures

## Creating a New User

1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter email and temporary password
5. Run CLI to set role:
   ```
   java -jar admin-cli.jar update-role <uid> <role>
   ```
6. Send welcome email to user

## Changing User Role

```bash
java -jar admin-cli.jar update-role abc123 ADMIN
```

## Deleting User

```bash
java -jar admin-cli.jar delete-user abc123
```
```

---

## Summary

### **✅ DO**

- Use Google Cloud Console for manual user management
- Use Backend Admin SDK for programmatic operations
- Create CLI tools for operational tasks
- Keep admin operations separate from user operations
- Enforce strong authentication (MFA) for admin access
- Log all admin operations comprehensively
- Restrict admin access to internal networks
- Use IAM roles for access control

### **❌ DON'T**

- Create frontend admin UI
- Expose admin endpoints to public internet
- Allow users to see other users' roles/permissions
- Trust client-side validation only
- Log sensitive operations only on frontend
- Mix admin plane with user plane
- Use weak authentication for admin operations
- Skip audit logging

---

## Conclusion

**Creating a frontend admin UI is a security anti-pattern.**

**Instead:**
1. ✅ Use Google Cloud Console (free, secure, maintained)
2. ✅ Create Backend Admin SDK (for automation)
3. ✅ Build CLI tools (for operations)
4. ✅ Separate admin plane from user plane

**Result:**
- Better security
- Easier compliance
- Lower maintenance
- Industry best practice

---

**Next Steps:**
- Integrate Google Cloud Identity Platform
- Set up Firebase Console access
- Create admin CLI tool
- Document admin procedures
- Remove any frontend admin code

**Status:** ✅ Ready for Implementation  
**Last Updated:** November 23, 2025

