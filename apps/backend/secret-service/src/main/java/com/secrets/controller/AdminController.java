package com.secrets.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserMetadata;
import com.google.firebase.auth.UserRecord;
import com.secrets.service.GoogleIdentityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Administrative operations for user management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final GoogleIdentityService googleIdentityService;

    public AdminController(GoogleIdentityService googleIdentityService) {
        this.googleIdentityService = googleIdentityService;
    }

    @GetMapping("/users")
    @Operation(summary = "List users", description = "Lists users from Google Identity Platform with their roles and permissions")
    public ResponseEntity<?> listUsers() {
        try {
            log.debug("Attempting to list users from Google Identity Platform");
            List<UserRecord> users = googleIdentityService.listUsers();
            log.debug("Successfully retrieved {} users", users.size());
            
            List<AdminUserResponse> response = users.stream()
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());
            
            log.info("Returning {} users to admin client", response.size());
            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            log.error("Firebase Auth error listing users - Code: {}, Message: {}", e.getErrorCode(), e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to list users");
            error.put("code", e.getErrorCode());
            error.put("message", e.getMessage());
            error.put("details", "The service account may not have sufficient permissions. Ensure it has 'Firebase Authentication Admin' role.");
            return ResponseEntity.status(500).body(error);
        } catch (IllegalStateException e) {
            log.error("Google Identity Platform not enabled: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Google Identity Platform is not enabled");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("=== UNEXPECTED ERROR listing users ===");
            log.error("Exception Type: {}", e.getClass().getName());
            log.error("Message: {}", e.getMessage());
            log.error("Full stack trace:", e);
            if (e.getCause() != null) {
                log.error("Caused by: {} - {}", e.getCause().getClass().getName(), e.getCause().getMessage());
            }
            
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            error.put("fullType", e.getClass().getName());
            if (e.getCause() != null) {
                error.put("cause", e.getCause().getMessage());
                error.put("causeType", e.getCause().getClass().getSimpleName());
            }
            error.put("details", "Check backend console/IDE logs for full stack trace. Most likely: Firebase service account lacks 'Firebase Admin' role.");
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/users")
    @Operation(summary = "Create a new user", description = "Creates a new user in Google Cloud Identity Platform")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody CreateUserRequest request) {
        try {
            log.info("Creating user: {}", request.getEmail());
            
            UserRecord userRecord = googleIdentityService.createUser(
                request.getEmail(),
                request.getPassword()
            );

            // Set roles if provided
            if (request.getRoles() != null && !request.getRoles().isEmpty()) {
                googleIdentityService.setUserRoles(userRecord.getUid(), request.getRoles());
                log.info("Set roles {} for user {}", request.getRoles(), request.getEmail());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("uid", userRecord.getUid());
            response.put("email", userRecord.getEmail());
            response.put("roles", request.getRoles());
            response.put("message", "User created successfully");

            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            log.error("Failed to create user: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create user: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/users/{uid}/role")
    @Operation(summary = "Update user role", description = "Convenience endpoint to assign a single role to a user")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable String uid,
            @RequestBody UpdateRoleRequest request) throws FirebaseAuthException {
        googleIdentityService.setUserRoles(uid, Collections.singletonList(request.getRole()));

        Map<String, Object> response = new HashMap<>();
        response.put("uid", uid);
        response.put("roles", Collections.singletonList(request.getRole()));
        response.put("message", "Role updated successfully. User must re-authenticate for changes to take effect.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{uid}/roles")
    @Operation(summary = "Set user roles", description = "Sets roles (custom claims) for a user")
    public ResponseEntity<Map<String, Object>> setUserRoles(
            @PathVariable String uid,
            @RequestBody SetRolesRequest request) {
        try {
            log.info("Setting roles {} for user {}", request.getRoles(), uid);
            
            googleIdentityService.setUserRoles(uid, request.getRoles());

            Map<String, Object> response = new HashMap<>();
            response.put("uid", uid);
            response.put("roles", request.getRoles());
            response.put("message", "Roles set successfully. User must re-authenticate for changes to take effect.");

            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            log.error("Failed to set roles: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to set roles: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/users/{email}")
    @Operation(summary = "Get user by email", description = "Retrieves user information from Google Identity Platform")
    public ResponseEntity<Map<String, Object>> getUserByEmail(@PathVariable String email) {
        try {
            UserRecord userRecord = googleIdentityService.getUserByEmail(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("uid", userRecord.getUid());
            response.put("email", userRecord.getEmail());
            response.put("displayName", userRecord.getDisplayName());
            response.put("disabled", userRecord.isDisabled());
            response.put("emailVerified", userRecord.isEmailVerified());

            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            log.error("Failed to get user: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get user: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }



    private AdminUserResponse mapToAdminResponse(UserRecord userRecord) {
        Map<String, Object> claims = userRecord.getCustomClaims();
        List<String> roles = extractClaimList(claims.get("roles"));
        if (roles.isEmpty()) {
            roles = Collections.singletonList("USER");
        }
        List<String> permissions = extractClaimList(claims.get("permissions"));

        UserMetadata metadata = userRecord.getUserMetadata();
        String createdAt = metadata != null && metadata.getCreationTimestamp() > 0
            ? Instant.ofEpochMilli(metadata.getCreationTimestamp()).toString()
            : null;
        String lastLoginAt = metadata != null && metadata.getLastSignInTimestamp() > 0
            ? Instant.ofEpochMilli(metadata.getLastSignInTimestamp()).toString()
            : null;

        AdminUserResponse response = new AdminUserResponse();
        response.setId(userRecord.getUid());
        response.setEmail(userRecord.getEmail());
        response.setRoles(roles);
        response.setPermissions(permissions);
        response.setCreatedAt(createdAt);
        response.setLastLoginAt(lastLoginAt);
        response.setDisabled(userRecord.isDisabled());
        response.setEmailVerified(userRecord.isEmailVerified());
        response.setPrimaryRole(roles.isEmpty() ? "USER" : roles.get(0));
        return response;
    }

    private List<String> extractClaimList(Object claimValue) {
        if (claimValue instanceof List<?>) {
            return ((List<?>) claimValue).stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    // DTOs
    public static class CreateUserRequest {
        private String email;
        private String password;
        private List<String> roles;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public List<String> getRoles() {
            return roles;
        }

        public void setRoles(List<String> roles) {
            this.roles = roles;
        }
    }

    public static class SetRolesRequest {
        private List<String> roles;

        public List<String> getRoles() {
            return roles;
        }

        public void setRoles(List<String> roles) {
            this.roles = roles;
        }
    }


    public static class UpdateRoleRequest {
        private String role;

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    public static class AdminUserResponse {
        private String id;
        private String email;
        private List<String> roles;
        private String primaryRole;
        private List<String> permissions;
        private String createdAt;
        private String lastLoginAt;
        private boolean disabled;
        private boolean emailVerified;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public List<String> getRoles() {
            return roles;
        }

        public void setRoles(List<String> roles) {
            this.roles = roles;
        }

        public List<String> getPermissions() {
            return permissions;
        }

        public void setPermissions(List<String> permissions) {
            this.permissions = permissions;
        }

        public String getPrimaryRole() {
            return primaryRole;
        }

        public void setPrimaryRole(String primaryRole) {
            this.primaryRole = primaryRole;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public String getLastLoginAt() {
            return lastLoginAt;
        }

        public void setLastLoginAt(String lastLoginAt) {
            this.lastLoginAt = lastLoginAt;
        }

        public boolean isDisabled() {
            return disabled;
        }

        public void setDisabled(boolean disabled) {
            this.disabled = disabled;
        }

        public boolean isEmailVerified() {
            return emailVerified;
        }

        public void setEmailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
        }
    }
}

