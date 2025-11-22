package com.secrets.controller;

import com.secrets.dto.SecretRequest;
import com.secrets.dto.SecretResponse;
import com.secrets.dto.SecretVersionResponse;
import com.secrets.entity.Secret;
import com.secrets.service.SecretService;
import com.secrets.service.SecretVersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/secrets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Secrets", description = "Secret management operations")
@SecurityRequirement(name = "bearerAuth")
public class SecretController {

    private final SecretService secretService;
    private final SecretVersionService secretVersionService;

    @PostMapping
    @Operation(summary = "Create a new secret", description = "Creates a new encrypted secret")
    public ResponseEntity<SecretResponse> createSecret(
            @Valid @RequestBody SecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Creating secret with key: {}", request.getKey());
        Secret secret = secretService.createSecret(
            request.getKey(),
            request.getValue(),
            userDetails.getUsername(),
            authentication
        );
        
        String decryptedValue = secretService.decryptSecretValue(secret);
        SecretResponse response = SecretResponse.from(secret, decryptedValue);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{key}")
    @Operation(summary = "Get a secret", description = "Retrieves and decrypts a secret by key")
    public ResponseEntity<SecretResponse> getSecret(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Retrieving secret with key: {}", key);
        Secret secret = secretService.getSecret(key, userDetails.getUsername(), authentication);
        String decryptedValue = secretService.decryptSecretValue(secret);
        SecretResponse response = SecretResponse.from(secret, decryptedValue);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{key}")
    @Operation(summary = "Update a secret", description = "Updates an existing secret")
    public ResponseEntity<SecretResponse> updateSecret(
            @PathVariable String key,
            @Valid @RequestBody SecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Updating secret with key: {}", key);
        Secret secret = secretService.updateSecret(
            key,
            request.getValue(),
            userDetails.getUsername(),
            authentication
        );
        
        String decryptedValue = secretService.decryptSecretValue(secret);
        SecretResponse response = SecretResponse.from(secret, decryptedValue);
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{key}")
    @Operation(summary = "Delete a secret", description = "Deletes a secret by key")
    public ResponseEntity<Void> deleteSecret(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Deleting secret with key: {}", key);
        secretService.deleteSecret(key, userDetails.getUsername(), authentication);
        
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{key}/versions")
    @Operation(summary = "Get secret version history", description = "Retrieves all versions of a secret")
    public ResponseEntity<List<SecretVersionResponse>> getSecretVersions(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.debug("Retrieving versions for secret with key: {}", key);
        var versions = secretVersionService.getVersions(key);
        List<SecretVersionResponse> response = versions.stream()
            .map(SecretVersionResponse::from)
            .toList();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{key}/versions/{versionNumber}")
    @Operation(summary = "Get specific secret version", description = "Retrieves a specific version of a secret")
    public ResponseEntity<SecretVersionResponse> getSecretVersion(
            @PathVariable String key,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.debug("Retrieving version {} for secret with key: {}", versionNumber, key);
        var version = secretVersionService.getVersion(key, versionNumber);
        
        return ResponseEntity.ok(SecretVersionResponse.from(version));
    }

    @PostMapping("/{key}/rollback/{versionNumber}")
    @Operation(summary = "Rollback secret to a specific version", 
               description = "Rolls back a secret to a previous version. Creates a new version for the rollback.")
    public ResponseEntity<SecretResponse> rollbackSecret(
            @PathVariable String key,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Rolling back secret '{}' to version {}", key, versionNumber);
        // Rollback requires WRITE permission (it modifies the secret)
        // Check permission by attempting to update the secret first
        Secret secret = secretService.getSecret(key, userDetails.getUsername(), authentication);
        
        Secret rolledBackSecret = secretVersionService.rollbackToVersion(
            key, versionNumber, userDetails.getUsername()
        );
        
        String decryptedValue = secretService.decryptSecretValue(rolledBackSecret);
        SecretResponse response = SecretResponse.from(rolledBackSecret, decryptedValue);
        
        return ResponseEntity.ok(response);
    }
}

