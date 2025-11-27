package com.secrets.controller;

import com.secrets.dto.SecretRequest;
import com.secrets.dto.ShareSecretRequest;
import com.secrets.dto.BulkSecretRequest;
import com.secrets.dto.BulkUpdateRequest;
import com.secrets.dto.BulkDeleteRequest;
import com.secrets.dto.SetExpirationRequest;
import com.secrets.service.SecretService;
import com.secrets.service.SecretVersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/secrets")
@Tag(name = "Secrets (DEPRECATED)", description = "Legacy global secret management - DEPRECATED. Use project-scoped endpoints instead.")
@SecurityRequirement(name = "bearerAuth")
@Deprecated
public class SecretController {

    private static final Logger log = LoggerFactory.getLogger(SecretController.class);

    public SecretController(SecretService secretService, SecretVersionService secretVersionService,
                           com.secrets.service.SecretExpirationService secretExpirationService,
                           com.secrets.security.PermissionEvaluator permissionEvaluator) {
        // Constructor kept for dependency injection compatibility
        // All methods now return deprecation messages
    }

    /**
     * Helper method to return deprecation response for legacy endpoints
     */
    private ResponseEntity<Map<String, String>> deprecatedResponse(String endpoint) {
        log.warn("DEPRECATED API called: {}. User should use project-scoped endpoints.", endpoint);
        return ResponseEntity.status(HttpStatus.GONE)
            .body(Map.of("error", "This endpoint is deprecated. Use project-scoped endpoints instead.",
                        "migration", "All secret operations must now be performed within a project context."));
    }

    @PostMapping
    @Operation(summary = "Create a new secret (DEPRECATED)",
               description = "DEPRECATED: Creates a new encrypted secret. Use /api/projects/{projectId}/secrets instead.")
    public ResponseEntity<Map<String, String>> createSecret(
            @Valid @RequestBody SecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {

        log.warn("DEPRECATED API called: POST /api/secrets. User should use project-scoped endpoints.");
        return ResponseEntity.status(HttpStatus.GONE)
            .body(Map.of("error", "This endpoint is deprecated. Use /api/projects/{projectId}/secrets instead.",
                        "migration", "Secrets must now be created within a project context."));
    }

    @GetMapping("/{key}")
    @Operation(summary = "Get a secret (DEPRECATED)",
               description = "DEPRECATED: Retrieves and decrypts a secret by key. Use /api/projects/{projectId}/secrets/{key} instead.")
    public ResponseEntity<Map<String, String>> getSecret(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {

        log.warn("DEPRECATED API called: GET /api/secrets/{}. User should use project-scoped endpoints.", key);
        return ResponseEntity.status(HttpStatus.GONE)
            .body(Map.of("error", "This endpoint is deprecated. Use /api/projects/{projectId}/secrets/{key} instead.",
                        "migration", "Secrets must now be accessed within a project context."));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Update a secret (DEPRECATED)",
               description = "DEPRECATED: Updates an existing secret. Use /api/projects/{projectId}/secrets/{key} instead.")
    public ResponseEntity<Map<String, String>> updateSecret(
            @PathVariable String key,
            @Valid @RequestBody SecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {

        log.warn("DEPRECATED API called: PUT /api/secrets/{}. User should use project-scoped endpoints.", key);
        return ResponseEntity.status(HttpStatus.GONE)
            .body(Map.of("error", "This endpoint is deprecated. Use /api/projects/{projectId}/secrets/{key} instead.",
                        "migration", "Secrets must now be updated within a project context."));
    }

    @DeleteMapping("/{key}")
    @Operation(summary = "Delete a secret (DEPRECATED)",
               description = "DEPRECATED: Deletes a secret by key. Use /api/projects/{projectId}/secrets/{key} instead.")
    public ResponseEntity<Map<String, String>> deleteSecret(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {

        log.warn("DEPRECATED API called: DELETE /api/secrets/{}. User should use project-scoped endpoints.", key);
        return ResponseEntity.status(HttpStatus.GONE)
            .body(Map.of("error", "This endpoint is deprecated. Use /api/projects/{projectId}/secrets/{key} instead.",
                        "migration", "Secrets must now be deleted within a project context."));
    }

    @GetMapping("/{key}/versions")
    @Operation(summary = "Get secret version history (DEPRECATED)",
               description = "DEPRECATED: Retrieves all versions of a secret. Use /api/projects/{projectId}/secrets/{key}/versions instead.")
    public ResponseEntity<Map<String, String>> getSecretVersions(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        return deprecatedResponse("GET /api/secrets/" + key + "/versions");
    }

    @GetMapping("/{key}/versions/{versionNumber}")
    @Operation(summary = "Get specific secret version (DEPRECATED)",
               description = "DEPRECATED: Retrieves a specific version of a secret. Use project-scoped endpoints instead.")
    public ResponseEntity<Map<String, String>> getSecretVersion(
            @PathVariable String key,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal UserDetails userDetails) {
        return deprecatedResponse("GET /api/secrets/" + key + "/versions/" + versionNumber);
    }

    @PostMapping("/{key}/rollback/{versionNumber}")
    @Operation(summary = "Rollback secret to a specific version (DEPRECATED)",
               description = "DEPRECATED: Rolls back a secret to a previous version. Use project-scoped endpoints instead.")
    public ResponseEntity<Map<String, String>> rollbackSecret(
            @PathVariable String key,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("POST /api/secrets/" + key + "/rollback/" + versionNumber);
    }

    @GetMapping
    @Operation(summary = "List secrets (DEPRECATED)",
               description = "DEPRECATED: Retrieves a paginated list of secrets. Use /api/projects/{projectId}/secrets instead.")
    public ResponseEntity<Map<String, String>> listSecrets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String createdBy,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {

        log.warn("DEPRECATED API called: GET /api/secrets (list). User should use project-scoped endpoints.");
        return ResponseEntity.status(HttpStatus.GONE)
            .body(Map.of("error", "This endpoint is deprecated. Use /api/projects/{projectId}/secrets instead.",
                        "migration", "Secrets must now be listed within a project context."));
    }

    @PostMapping("/{key}/rotate")
    @Operation(summary = "Rotate a secret (DEPRECATED)",
               description = "DEPRECATED: Generates a new value for a secret. Use /api/projects/{projectId}/secrets/{key}/rotate instead.")
    public ResponseEntity<Map<String, String>> rotateSecret(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("POST /api/secrets/" + key + "/rotate");
    }

    @PostMapping("/{key}/share")
    @Operation(summary = "Share a secret (DEPRECATED)",
               description = "DEPRECATED: Shares a secret with another user. Use project membership instead.")
    public ResponseEntity<Map<String, String>> shareSecret(
            @PathVariable String key,
            @Valid @RequestBody ShareSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("POST /api/secrets/" + key + "/share");
    }

    @DeleteMapping("/{key}/share/{sharedWith}")
    @Operation(summary = "Unshare a secret (DEPRECATED)",
               description = "DEPRECATED: Revokes access to a secret for a user. Use project membership instead.")
    public ResponseEntity<Map<String, String>> unshareSecret(
            @PathVariable String key,
            @PathVariable String sharedWith,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("DELETE /api/secrets/" + key + "/share/" + sharedWith);
    }

    @GetMapping("/{key}/shared")
    @Operation(summary = "Get users a secret is shared with (DEPRECATED)",
               description = "DEPRECATED: Retrieves list of users a secret is shared with. Use project membership instead.")
    public ResponseEntity<Map<String, String>> getSharedUsers(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("GET /api/secrets/" + key + "/shared");
    }

    @GetMapping("/shared/with-me")
    @Operation(summary = "Get secrets shared with me (DEPRECATED)",
               description = "DEPRECATED: Retrieves all secrets that have been shared with the current user. Use project membership instead.")
    public ResponseEntity<Map<String, String>> getSecretsSharedWithMe(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("GET /api/secrets/shared/with-me");
    }

    @PostMapping("/bulk")
    @Operation(summary = "Bulk create secrets (DEPRECATED)",
               description = "DEPRECATED: Creates multiple secrets. Use project-scoped bulk operations instead.")
    public ResponseEntity<Map<String, String>> bulkCreateSecrets(
            @Valid @RequestBody BulkSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("POST /api/secrets/bulk");
    }

    @PutMapping("/bulk")
    @Operation(summary = "Bulk update secrets (DEPRECATED)",
               description = "DEPRECATED: Updates multiple secrets. Use project-scoped bulk operations instead.")
    public ResponseEntity<Map<String, String>> bulkUpdateSecrets(
            @Valid @RequestBody BulkUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("PUT /api/secrets/bulk");
    }

    @DeleteMapping("/bulk")
    @Operation(summary = "Bulk delete secrets (DEPRECATED)",
               description = "DEPRECATED: Deletes multiple secrets. Use project-scoped bulk operations instead.")
    public ResponseEntity<Map<String, String>> bulkDeleteSecrets(
            @Valid @RequestBody BulkDeleteRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("DELETE /api/secrets/bulk");
    }

    @PostMapping("/{key}/expiration")
    @Operation(summary = "Set secret expiration (DEPRECATED)",
               description = "DEPRECATED: Sets an expiration date for a secret. Use project-scoped expiration instead.")
    public ResponseEntity<Map<String, String>> setExpiration(
            @PathVariable String key,
            @Valid @RequestBody SetExpirationRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("POST /api/secrets/" + key + "/expiration");
    }

    @DeleteMapping("/{key}/expiration")
    @Operation(summary = "Remove secret expiration (DEPRECATED)",
               description = "DEPRECATED: Removes expiration from a secret. Use project-scoped expiration instead.")
    public ResponseEntity<Map<String, String>> removeExpiration(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("DELETE /api/secrets/" + key + "/expiration");
    }

    @GetMapping("/expired")
    @Operation(summary = "Get expired secrets (DEPRECATED)",
               description = "DEPRECATED: Retrieves expired secrets. Use project-scoped expiration queries instead.")
    public ResponseEntity<Map<String, String>> getExpiredSecrets(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("GET /api/secrets/expired");
    }

    @GetMapping("/expiring-soon")
    @Operation(summary = "Get secrets expiring soon (DEPRECATED)",
               description = "DEPRECATED: Retrieves secrets expiring soon. Use project-scoped expiration queries instead.")
    public ResponseEntity<Map<String, String>> getSecretsExpiringSoon(
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        return deprecatedResponse("GET /api/secrets/expiring-soon");
    }
}

