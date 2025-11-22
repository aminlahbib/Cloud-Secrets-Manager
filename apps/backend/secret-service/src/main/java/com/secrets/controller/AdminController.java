package com.secrets.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.secrets.service.GoogleIdentityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin", description = "Administrative operations for user management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final GoogleIdentityService googleIdentityService;

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

    @PostMapping("/users/{uid}/permissions")
    @Operation(summary = "Set user permissions", description = "Sets permissions (custom claims) for a user. User must re-authenticate for changes to take effect.")
    public ResponseEntity<Map<String, Object>> setUserPermissions(
            @PathVariable String uid,
            @RequestBody SetPermissionsRequest request) {
        try {
            log.info("Setting permissions {} for user {}", request.getPermissions(), uid);
            
            googleIdentityService.setUserPermissions(uid, request.getPermissions());

            Map<String, Object> response = new HashMap<>();
            response.put("uid", uid);
            response.put("permissions", request.getPermissions());
            response.put("message", "Permissions set successfully. User must re-authenticate for changes to take effect.");

            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            log.error("Failed to set permissions: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to set permissions: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
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

    public static class SetPermissionsRequest {
        private List<String> permissions;

        public List<String> getPermissions() {
            return permissions;
        }

        public void setPermissions(List<String> permissions) {
            this.permissions = permissions;
        }
    }
}

