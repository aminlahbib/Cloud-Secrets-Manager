package com.secrets.controller;

import com.secrets.dto.SecretRequest;
import com.secrets.dto.SecretResponse;
import com.secrets.dto.SecretVersionResponse;
import com.secrets.dto.ShareSecretRequest;
import com.secrets.dto.SharedSecretResponse;
import com.secrets.dto.BulkSecretRequest;
import com.secrets.dto.BulkSecretResponse;
import com.secrets.dto.BulkUpdateRequest;
import com.secrets.dto.BulkDeleteRequest;
import com.secrets.dto.SetExpirationRequest;
import com.secrets.entity.Secret;
import com.secrets.service.SecretService;
import com.secrets.service.SecretVersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/secrets")
@Tag(name = "Secrets", description = "Secret management operations")
@SecurityRequirement(name = "bearerAuth")
public class SecretController {

    private static final Logger log = LoggerFactory.getLogger(SecretController.class);

    private final SecretService secretService;
    private final SecretVersionService secretVersionService;
    private final com.secrets.service.SecretExpirationService secretExpirationService;
    private final com.secrets.security.PermissionEvaluator permissionEvaluator;

    public SecretController(SecretService secretService, SecretVersionService secretVersionService,
                           com.secrets.service.SecretExpirationService secretExpirationService,
                           com.secrets.security.PermissionEvaluator permissionEvaluator) {
        this.secretService = secretService;
        this.secretVersionService = secretVersionService;
        this.secretExpirationService = secretExpirationService;
        this.permissionEvaluator = permissionEvaluator;
    }

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

    @GetMapping
    @Operation(summary = "List secrets", 
               description = "Retrieves a paginated list of secrets with optional filtering and search")
    public ResponseEntity<Page<SecretResponse>> listSecrets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String createdBy,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Listing secrets - page: {}, size: {}, sortBy: {}, keyword: {}, createdBy: {}", 
            page, size, sortBy, keyword, createdBy);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<Secret> secrets = secretService.listSecrets(pageable, keyword, createdBy, authentication);
        
        // Convert to response DTOs (without decrypting values for list view - only show metadata)
        Page<SecretResponse> response = secrets.map(secret -> 
            SecretResponse.builder()
                .key(secret.getSecretKey())
                .value("***REDACTED***") // Don't expose values in list view
                .createdBy(secret.getCreatedBy())
                .createdAt(secret.getCreatedAt())
                .updatedAt(secret.getUpdatedAt())
                .build()
        );
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{key}/rotate")
    @Operation(summary = "Rotate a secret", 
               description = "Generates a new value for a secret and creates a new version. Requires ROTATE permission.")
    public ResponseEntity<SecretResponse> rotateSecret(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Rotating secret with key: {}", key);
        Secret secret = secretService.rotateSecret(key, userDetails.getUsername(), authentication);
        
        String decryptedValue = secretService.decryptSecretValue(secret);
        SecretResponse response = SecretResponse.from(secret, decryptedValue);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{key}/share")
    @Operation(summary = "Share a secret", 
               description = "Shares a secret with another user. Requires SHARE permission.")
    public ResponseEntity<SharedSecretResponse> shareSecret(
            @PathVariable String key,
            @Valid @RequestBody ShareSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Sharing secret '{}' with user '{}'", key, request.getSharedWith());
        var sharedSecret = secretService.shareSecret(
            key, 
            request.getSharedWith(), 
            userDetails.getUsername(),
            request.getPermission(),
            authentication
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(SharedSecretResponse.from(sharedSecret));
    }

    @DeleteMapping("/{key}/share/{sharedWith}")
    @Operation(summary = "Unshare a secret", 
               description = "Revokes access to a secret for a user. Requires SHARE permission.")
    public ResponseEntity<Void> unshareSecret(
            @PathVariable String key,
            @PathVariable String sharedWith,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Unsharing secret '{}' from user '{}'", key, sharedWith);
        secretService.unshareSecret(key, sharedWith, userDetails.getUsername(), authentication);
        
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{key}/shared")
    @Operation(summary = "Get users a secret is shared with", 
               description = "Retrieves list of users a secret is shared with. Only the owner can view this.")
    public ResponseEntity<List<SharedSecretResponse>> getSharedUsers(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Getting shared users for secret '{}'", key);
        var sharedSecrets = secretService.getSharedUsers(key, userDetails.getUsername(), authentication);
        
        List<SharedSecretResponse> response = sharedSecrets.stream()
            .map(SharedSecretResponse::from)
            .toList();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/shared/with-me")
    @Operation(summary = "Get secrets shared with me", 
               description = "Retrieves all secrets that have been shared with the current user")
    public ResponseEntity<List<SharedSecretResponse>> getSecretsSharedWithMe(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Getting secrets shared with user '{}'", userDetails.getUsername());
        var sharedSecrets = secretService.getSecretsSharedWithUser(userDetails.getUsername(), authentication);
        
        List<SharedSecretResponse> response = sharedSecrets.stream()
            .map(SharedSecretResponse::from)
            .toList();
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk")
    @Operation(summary = "Bulk create secrets", 
               description = "Creates multiple secrets in a single request. Returns results for each secret.")
    public ResponseEntity<BulkSecretResponse> bulkCreateSecrets(
            @Valid @RequestBody BulkSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Bulk creating {} secrets", request.getSecrets().size());
        BulkSecretResponse response = secretService.bulkCreateSecrets(
            request.getSecrets(),
            userDetails.getUsername(),
            authentication
        );
        
        HttpStatus status = response.getFailed() == 0 
            ? HttpStatus.CREATED 
            : HttpStatus.MULTI_STATUS; // 207
        
        return ResponseEntity.status(status).body(response);
    }

    @PutMapping("/bulk")
    @Operation(summary = "Bulk update secrets", 
               description = "Updates multiple secrets in a single request. Returns results for each secret.")
    public ResponseEntity<BulkSecretResponse> bulkUpdateSecrets(
            @Valid @RequestBody BulkUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Bulk updating {} secrets", request.getSecrets().size());
        BulkSecretResponse response = secretService.bulkUpdateSecrets(
            request.getSecrets(),
            userDetails.getUsername(),
            authentication
        );
        
        HttpStatus status = response.getFailed() == 0 
            ? HttpStatus.OK 
            : HttpStatus.MULTI_STATUS; // 207
        
        return ResponseEntity.status(status).body(response);
    }

    @DeleteMapping("/bulk")
    @Operation(summary = "Bulk delete secrets", 
               description = "Deletes multiple secrets in a single request. Returns results for each secret.")
    public ResponseEntity<BulkSecretResponse> bulkDeleteSecrets(
            @Valid @RequestBody BulkDeleteRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Bulk deleting {} secrets", request.getKeys().size());
        BulkSecretResponse response = secretService.bulkDeleteSecrets(
            request.getKeys(),
            userDetails.getUsername(),
            authentication
        );
        
        HttpStatus status = response.getFailed() == 0 
            ? HttpStatus.OK 
            : HttpStatus.MULTI_STATUS; // 207
        
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/{key}/expiration")
    @Operation(summary = "Set secret expiration", 
               description = "Sets an expiration date for a secret. The secret will be marked as expired after this date.")
    public ResponseEntity<SecretResponse> setExpiration(
            @PathVariable String key,
            @Valid @RequestBody SetExpirationRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Setting expiration for secret '{}' to {}", key, request.getExpiresAt());
        
        // Verify user has access to the secret
        secretService.getSecret(key, userDetails.getUsername(), authentication);
        
        Secret secret = secretExpirationService.setExpiration(key, request.getExpiresAt());
        String decryptedValue = secretService.decryptSecretValue(secret);
        SecretResponse response = SecretResponse.from(secret, decryptedValue);
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{key}/expiration")
    @Operation(summary = "Remove secret expiration", 
               description = "Removes expiration from a secret, making it never expire.")
    public ResponseEntity<SecretResponse> removeExpiration(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        log.debug("Removing expiration for secret '{}'", key);
        
        // Verify user has access to the secret
        secretService.getSecret(key, userDetails.getUsername(), authentication);
        
        Secret secret = secretExpirationService.removeExpiration(key);
        String decryptedValue = secretService.decryptSecretValue(secret);
        SecretResponse response = SecretResponse.from(secret, decryptedValue);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/expired")
    @Operation(summary = "Get expired secrets", 
               description = "Retrieves expired secrets. Admins see all, regular users see only their accessible secrets. Requires READ permission.")
    public ResponseEntity<List<SecretResponse>> getExpiredSecrets(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        String username = userDetails.getUsername();
        boolean isAdmin = permissionEvaluator.isAdmin(authentication);
        
        log.debug("Getting expired secrets for user {} (admin: {})", username, isAdmin);
        
        // Check permission
        if (!isAdmin && 
            !permissionEvaluator.hasPermission(authentication, com.secrets.security.Permission.READ)) {
            throw new org.springframework.security.access.AccessDeniedException("User does not have READ permission");
        }
        
        var expiredSecrets = secretExpirationService.getExpiredSecrets(username, isAdmin);
        List<SecretResponse> response = expiredSecrets.stream()
            .map(secret -> SecretResponse.builder()
                .key(secret.getSecretKey())
                .value("***REDACTED***")
                .createdBy(secret.getCreatedBy())
                .createdAt(secret.getCreatedAt())
                .updatedAt(secret.getUpdatedAt())
                .build())
            .toList();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/expiring-soon")
    @Operation(summary = "Get secrets expiring soon", 
               description = "Retrieves secrets that will expire within the specified number of days. Admins see all, regular users see only their accessible secrets. Requires READ permission.")
    public ResponseEntity<List<SecretResponse>> getSecretsExpiringSoon(
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        
        String username = userDetails.getUsername();
        boolean isAdmin = permissionEvaluator.isAdmin(authentication);
        
        log.debug("Getting secrets expiring within {} days for user {} (admin: {})", days, username, isAdmin);
        
        // Check permission
        if (!isAdmin && 
            !permissionEvaluator.hasPermission(authentication, com.secrets.security.Permission.READ)) {
            throw new org.springframework.security.access.AccessDeniedException("User does not have READ permission");
        }
        
        var expiringSecrets = secretExpirationService.getSecretsExpiringSoon(days, username, isAdmin);
        List<SecretResponse> response = expiringSecrets.stream()
            .map(secret -> SecretResponse.builder()
                .key(secret.getSecretKey())
                .value("***REDACTED***")
                .createdBy(secret.getCreatedBy())
                .createdAt(secret.getCreatedAt())
                .updatedAt(secret.getUpdatedAt())
                .build())
            .toList();
        
        return ResponseEntity.ok(response);
    }
}

