package com.secrets.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.secrets.service.GoogleIdentityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Temporary setup controller for initial user creation.
 * 
 * ⚠️ SECURITY WARNING: This controller should be disabled or secured after initial setup!
 * 
 * To disable: Set setup.enabled=false in application.yml
 * Or remove this controller after creating your first admin user.
 */
@RestController
@RequestMapping("/api/setup")
@Tag(name = "Setup", description = "Initial setup operations (temporary)")
public class SetupController {

    private static final Logger log = LoggerFactory.getLogger(SetupController.class);

    private final GoogleIdentityService googleIdentityService;

    @Value("${setup.enabled:true}")
    private boolean setupEnabled;

    public SetupController(GoogleIdentityService googleIdentityService) {
        this.googleIdentityService = googleIdentityService;
    }

    @PostMapping("/create-admin")
    @Operation(summary = "Create initial admin user", 
               description = "Creates the first admin user. ⚠️ Disable this endpoint after setup!")
    public ResponseEntity<Map<String, Object>> createAdminUser(@RequestBody CreateAdminRequest request) {
        if (!setupEnabled) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Setup endpoint is disabled");
            error.put("message", "This endpoint has been disabled for security. Use the admin API instead.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            log.warn("⚠️ Setup endpoint used to create admin user: {}", request.getEmail());
            
            // Create user
            UserRecord userRecord = googleIdentityService.createUser(
                request.getEmail(),
                request.getPassword()
            );

            // Set ADMIN role
            googleIdentityService.setUserRoles(
                userRecord.getUid(),
                List.of("USER", "ADMIN")
            );

            log.info("✅ Admin user created successfully: {} (UID: {})", 
                request.getEmail(), userRecord.getUid());

            Map<String, Object> response = new HashMap<>();
            response.put("uid", userRecord.getUid());
            response.put("email", userRecord.getEmail());
            response.put("roles", List.of("USER", "ADMIN"));
            response.put("message", "Admin user created successfully");
            response.put("warning", "⚠️ Disable setup endpoint after initial setup for security!");

            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            log.error("Failed to create admin user: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create admin user: " + e.getMessage());
            error.put("code", e.getErrorCode());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/create-user")
    @Operation(summary = "Create a test user", 
               description = "Creates a test user with specified roles")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody CreateUserRequest request) {
        if (!setupEnabled) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Setup endpoint is disabled");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            log.info("Creating user via setup endpoint: {}", request.getEmail());
            
            UserRecord userRecord = googleIdentityService.createUser(
                request.getEmail(),
                request.getPassword()
            );

            // Set roles if provided, default to USER
            List<String> roles = request.getRoles() != null && !request.getRoles().isEmpty()
                ? request.getRoles()
                : List.of("USER");
            
            googleIdentityService.setUserRoles(userRecord.getUid(), roles);

            Map<String, Object> response = new HashMap<>();
            response.put("uid", userRecord.getUid());
            response.put("email", userRecord.getEmail());
            response.put("roles", roles);
            response.put("message", "User created successfully");

            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            log.error("Failed to create user: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create user: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // DTOs
    public static class CreateAdminRequest {
        private String email;
        private String password;

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
    }

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
}

