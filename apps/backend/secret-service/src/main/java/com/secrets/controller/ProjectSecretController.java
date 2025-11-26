package com.secrets.controller;

import com.secrets.dto.SecretRequest;
import com.secrets.dto.SecretResponse;
import com.secrets.dto.SecretVersionResponse;
import com.secrets.entity.Secret;
import com.secrets.entity.SecretVersion;
import com.secrets.service.ProjectSecretService;
import com.secrets.service.SecretService;
import com.secrets.service.UserService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/secrets")
@Tag(name = "Project Secrets", description = "Project-scoped secret management operations")
@SecurityRequirement(name = "bearerAuth")
public class ProjectSecretController {

    private static final Logger log = LoggerFactory.getLogger(ProjectSecretController.class);

    private final ProjectSecretService projectSecretService;
    private final SecretService secretService; // For decryption
    private final UserService userService;

    public ProjectSecretController(ProjectSecretService projectSecretService,
                                  SecretService secretService,
                                  UserService userService) {
        this.projectSecretService = projectSecretService;
        this.secretService = secretService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List project secrets", description = "Get all secrets in a project")
    public ResponseEntity<Page<SecretResponse>> listProjectSecrets(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Secret> secrets = projectSecretService.listProjectSecrets(projectId, userId, keyword, pageable);
        
        Page<SecretResponse> responses = secrets.map(secret -> {
            String decryptedValue = secretService.decryptSecretValue(secret);
            return SecretResponse.from(secret, decryptedValue);
        });
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{key}")
    @Operation(summary = "Get project secret", description = "Get a secret from a project")
    public ResponseEntity<SecretResponse> getProjectSecret(
            @PathVariable UUID projectId,
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        Secret secret = projectSecretService.getProjectSecret(projectId, key, userId);
        String decryptedValue = secretService.decryptSecretValue(secret);
        
        return ResponseEntity.ok(SecretResponse.from(secret, decryptedValue));
    }

    @PostMapping
    @Operation(summary = "Create project secret", description = "Create a new secret in a project")
    public ResponseEntity<SecretResponse> createProjectSecret(
            @PathVariable UUID projectId,
            @Valid @RequestBody SecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        Secret secret = projectSecretService.createProjectSecret(projectId, request, userId);
        String decryptedValue = secretService.decryptSecretValue(secret);
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(SecretResponse.from(secret, decryptedValue));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Update project secret", description = "Update a secret in a project")
    public ResponseEntity<SecretResponse> updateProjectSecret(
            @PathVariable UUID projectId,
            @PathVariable String key,
            @Valid @RequestBody SecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        Secret secret = projectSecretService.updateProjectSecret(projectId, key, request, userId);
        String decryptedValue = secretService.decryptSecretValue(secret);
        
        return ResponseEntity.ok(SecretResponse.from(secret, decryptedValue));
    }

    @DeleteMapping("/{key}")
    @Operation(summary = "Delete project secret", description = "Delete a secret from a project")
    public ResponseEntity<Void> deleteProjectSecret(
            @PathVariable UUID projectId,
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        projectSecretService.deleteProjectSecret(projectId, key, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{key}/rotate")
    @Operation(summary = "Rotate project secret", description = "Rotate a secret in a project")
    public ResponseEntity<SecretResponse> rotateProjectSecret(
            @PathVariable UUID projectId,
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        Secret secret = projectSecretService.rotateProjectSecret(projectId, key, userId);
        String decryptedValue = secretService.decryptSecretValue(secret);
        
        return ResponseEntity.ok(SecretResponse.from(secret, decryptedValue));
    }

    @PostMapping("/{key}/move")
    @Operation(summary = "Move secret", description = "Move a secret to another project")
    public ResponseEntity<SecretResponse> moveSecret(
            @PathVariable UUID projectId,
            @PathVariable String key,
            @RequestBody MoveSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        Secret secret = projectSecretService.moveSecret(projectId, key, request.getTargetProjectId(), userId);
        String decryptedValue = secretService.decryptSecretValue(secret);
        
        return ResponseEntity.ok(SecretResponse.from(secret, decryptedValue));
    }

    @PostMapping("/{key}/copy")
    @Operation(summary = "Copy secret", description = "Copy a secret to another project")
    public ResponseEntity<SecretResponse> copySecret(
            @PathVariable UUID projectId,
            @PathVariable String key,
            @RequestBody CopySecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        Secret secret = projectSecretService.copySecret(projectId, key, request.getTargetProjectId(), request.getNewKey(), userId);
        String decryptedValue = secretService.decryptSecretValue(secret);
        
        return ResponseEntity.ok(SecretResponse.from(secret, decryptedValue));
    }

    @GetMapping("/{key}/versions")
    @Operation(summary = "Get secret versions", description = "Get version history for a secret")
    public ResponseEntity<List<SecretVersionResponse>> getSecretVersions(
            @PathVariable UUID projectId,
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        List<SecretVersion> versions = projectSecretService.getSecretVersions(projectId, key, userId);
        List<SecretVersionResponse> responses = versions.stream()
            .map(this::toVersionResponse)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    private SecretVersionResponse toVersionResponse(SecretVersion version) {
        SecretVersionResponse response = new SecretVersionResponse();
        response.setId(version.getId().toString());
        response.setSecretKey(version.getSecret().getSecretKey());
        response.setVersionNumber(version.getVersionNumber());
        response.setChangedBy(version.getCreatedBy() != null ? version.getCreatedBy().toString() : "Unknown");
        response.setChangeDescription(version.getChangeNote());
        response.setCreatedAt(version.getCreatedAt());
        return response;
    }

    // DTOs for move/copy requests
    public static class MoveSecretRequest {
        private UUID targetProjectId;

        public UUID getTargetProjectId() {
            return targetProjectId;
        }

        public void setTargetProjectId(UUID targetProjectId) {
            this.targetProjectId = targetProjectId;
        }
    }

    public static class CopySecretRequest {
        private UUID targetProjectId;
        private String newKey;

        public UUID getTargetProjectId() {
            return targetProjectId;
        }

        public void setTargetProjectId(UUID targetProjectId) {
            this.targetProjectId = targetProjectId;
        }

        public String getNewKey() {
            return newKey;
        }

        public void setNewKey(String newKey) {
            this.newKey = newKey;
        }
    }
}

