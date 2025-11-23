package com.secrets.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.secrets.dto.setup.CustomClaimRequest;
import com.secrets.service.FirebaseClaimsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/setup/firebase")
@Tag(name = "Firebase Setup", description = "Temporary endpoints used to assign custom claims to Firebase users")
public class FirebaseSetupController {

    private static final Logger log = LoggerFactory.getLogger(FirebaseSetupController.class);

    @Value("${setup.enabled:true}")
    private boolean setupEnabled;

    private final FirebaseClaimsService firebaseClaimsService;

    public FirebaseSetupController(FirebaseClaimsService firebaseClaimsService) {
        this.firebaseClaimsService = firebaseClaimsService;
    }

    @PostMapping("/claims")
    @Operation(summary = "Assign custom claims", description = "Assigns roles and permissions to a Firebase user. Disable this endpoint after setup.")
    public ResponseEntity<?> assignCustomClaims(@Valid @RequestBody CustomClaimRequest request) throws FirebaseAuthException {
        if (!setupEnabled) {
            Map<String, Object> body = new HashMap<>();
            body.put("error", "Setup endpoint disabled");
            body.put("message", "Enable setup.enabled=true to use this endpoint.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }

        firebaseClaimsService.assignCustomClaims(
            request.getEmail(),
            request.getRoles(),
            request.getPermissions()
        );

        log.info("Custom claims assigned to {}", request.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("email", request.getEmail());
        response.put("roles", request.getRoles());
        response.put("permissions", request.getPermissions());
        response.put("message", "Custom claims assigned successfully. Ask user to sign out/in.");

        return ResponseEntity.ok(response);
    }
}

