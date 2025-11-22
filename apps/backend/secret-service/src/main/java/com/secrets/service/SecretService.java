package com.secrets.service;

import com.secrets.client.AuditClient;
import com.secrets.entity.Secret;
import com.secrets.entity.SharedSecret;
import com.secrets.exception.SecretAlreadyExistsException;
import com.secrets.exception.SecretNotFoundException;
import com.secrets.repository.SecretRepository;
import com.secrets.repository.SecretVersionRepository;
import com.secrets.repository.SharedSecretRepository;
import com.secrets.security.Permission;
import com.secrets.security.PermissionEvaluator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecretService {

    private final SecretRepository secretRepository;
    private final EncryptionService encryptionService;
    private final AuditClient auditClient;
    private final SecretVersionService secretVersionService;
    private final SecretVersionRepository secretVersionRepository;
    private final PermissionEvaluator permissionEvaluator;
    private final SharedSecretRepository sharedSecretRepository;

    @Transactional
    public Secret createSecret(String key, String value, String createdBy, Authentication authentication) {
        log.debug("Creating secret with key: {}", key);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.WRITE)) {
            throw new AccessDeniedException("User does not have WRITE permission");
        }
        
        if (secretRepository.existsBySecretKey(key)) {
            throw new SecretAlreadyExistsException("Secret with key '" + key + "' already exists");
        }

        String encryptedValue = encryptionService.encrypt(value);
        
        Secret secret = Secret.builder()
            .secretKey(key)
            .encryptedValue(encryptedValue)
            .createdBy(createdBy)
            .build();

        Secret savedSecret = secretRepository.save(secret);
        
        // Create initial version
        secretVersionService.createVersion(savedSecret, createdBy, "Initial version");
        
        // Async audit logging
        auditClient.logEvent("CREATE", key, createdBy);
        
        log.info("Secret created successfully with key: {}", key);
        return savedSecret;
    }

    @Transactional(readOnly = true)
    public Secret getSecret(String key, String username, Authentication authentication) {
        log.debug("Retrieving secret with key: {}", key);
        
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));

        // Check if secret is expired
        checkExpiration(secret);

        // Check access: user must be admin, have READ permission, be the creator, or have the secret shared with them
        boolean hasAccess = false;
        
        if (permissionEvaluator.isAdmin(authentication)) {
            hasAccess = true;
        } else if (permissionEvaluator.hasPermission(authentication, Permission.READ)) {
            // Check if user is the creator
            if (secret.getCreatedBy().equals(username)) {
                hasAccess = true;
            } else {
                // Check if secret is shared with the user
                hasAccess = sharedSecretRepository.existsBySecretKeyAndSharedWith(key, username);
            }
        }
        
        if (!hasAccess) {
            throw new AccessDeniedException("User does not have access to this secret");
        }

        // Async audit logging
        auditClient.logEvent("READ", key, username);
        
        log.info("Secret retrieved successfully with key: {}", key);
        return secret;
    }

    @Transactional
    public Secret updateSecret(String key, String newValue, String updatedBy, Authentication authentication) {
        log.debug("Updating secret with key: {}", key);
        
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));

        // Check if secret is expired (can't update expired secrets)
        checkExpiration(secret);

        // Check access: user must be admin, have WRITE permission, be the creator, or have WRITE permission via sharing
        boolean hasAccess = false;
        
        if (permissionEvaluator.isAdmin(authentication)) {
            hasAccess = true;
        } else if (permissionEvaluator.hasPermission(authentication, Permission.WRITE)) {
            // Check if user is the creator
            if (secret.getCreatedBy().equals(updatedBy)) {
                hasAccess = true;
            } else {
                // Check if secret is shared with the user with WRITE permission
                SharedSecret sharedSecret = sharedSecretRepository.findBySecretKeyAndSharedWith(key, updatedBy)
                    .orElse(null);
                if (sharedSecret != null && "WRITE".equalsIgnoreCase(sharedSecret.getPermission())) {
                    hasAccess = true;
                }
            }
        }
        
        if (!hasAccess) {
            throw new AccessDeniedException("User does not have permission to update this secret");
        }

        String encryptedValue = encryptionService.encrypt(newValue);
        secret.setEncryptedValue(encryptedValue);
        
        Secret updatedSecret = secretRepository.save(secret);
        
        // Create new version
        secretVersionService.createVersion(updatedSecret, updatedBy, "Secret value updated");
        
        // Async audit logging
        auditClient.logEvent("UPDATE", key, updatedBy);
        
        log.info("Secret updated successfully with key: {}", key);
        return updatedSecret;
    }

    @Transactional
    public void deleteSecret(String key, String deletedBy, Authentication authentication) {
        log.debug("Deleting secret with key: {}", key);
        
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));

        // Only the creator or admin can delete secrets (DELETE permission is not shareable)
        boolean hasAccess = false;
        
        if (permissionEvaluator.isAdmin(authentication)) {
            hasAccess = true;
        } else if (permissionEvaluator.hasPermission(authentication, Permission.DELETE)) {
            // Only the creator can delete
            if (secret.getCreatedBy().equals(deletedBy)) {
                hasAccess = true;
            }
        }
        
        if (!hasAccess) {
            throw new AccessDeniedException("Only the secret owner can delete it");
        }

        // Delete all shared secrets first
        sharedSecretRepository.deleteBySecretKey(key);
        
        // Delete all versions first (cascade delete)
        secretVersionRepository.deleteBySecretKey(key);
        
        // Delete the secret
        secretRepository.deleteBySecretKey(key);
        
        // Async audit logging
        auditClient.logEvent("DELETE", key, deletedBy);
        
        log.info("Secret deleted successfully with key: {}", key);
    }

    public String decryptSecretValue(Secret secret) {
        return encryptionService.decrypt(secret.getEncryptedValue());
    }

    /**
     * List all secrets with pagination and optional filtering
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Secret> listSecrets(
            org.springframework.data.domain.Pageable pageable,
            String keyword,
            String createdBy,
            Authentication authentication) {
        
        log.debug("Listing secrets with pagination - page: {}, size: {}, keyword: {}, createdBy: {}", 
            pageable.getPageNumber(), pageable.getPageSize(), keyword, createdBy);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.READ)) {
            throw new AccessDeniedException("User does not have READ permission");
        }
        
        org.springframework.data.domain.Page<Secret> secrets;
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            // Search with keyword
            if (createdBy != null && !createdBy.trim().isEmpty()) {
                secrets = secretRepository.searchSecretsByCreator(createdBy, keyword.trim(), pageable);
            } else {
                secrets = secretRepository.searchSecrets(keyword.trim(), pageable);
            }
        } else if (createdBy != null && !createdBy.trim().isEmpty()) {
            // Filter by creator
            secrets = secretRepository.findByCreatedBy(createdBy.trim(), pageable);
        } else {
            // List all
            secrets = secretRepository.findAll(pageable);
        }
        
        log.info("Retrieved {} secrets (page {})", secrets.getNumberOfElements(), pageable.getPageNumber());
        return secrets;
    }

    /**
     * Rotate a secret - generates a new value and creates a new version
     */
    @Transactional
    public Secret rotateSecret(String key, String rotatedBy, Authentication authentication) {
        log.debug("Rotating secret with key: {}", key);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.ROTATE)) {
            throw new AccessDeniedException("User does not have ROTATE permission");
        }
        
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));
        
        // Generate a new random value (in a real scenario, this might call an external service)
        // For now, we'll re-encrypt the current value as a placeholder
        // In production, you might want to integrate with a secret generation service
        String currentValue = encryptionService.decrypt(secret.getEncryptedValue());
        String newValue = generateNewSecretValue(currentValue);
        
        String encryptedValue = encryptionService.encrypt(newValue);
        secret.setEncryptedValue(encryptedValue);
        
        Secret rotatedSecret = secretRepository.save(secret);
        
        // Create new version for rotation
        secretVersionService.createVersion(rotatedSecret, rotatedBy, "Secret rotated");
        
        // Async audit logging
        auditClient.logEvent("ROTATE", key, rotatedBy);
        
        log.info("Secret rotated successfully with key: {}", key);
        return rotatedSecret;
    }
    
    /**
     * Generate a new secret value
     * In production, this should integrate with a proper secret generation service
     */
    private String generateNewSecretValue(String currentValue) {
        // Simple implementation: append timestamp to make it unique
        // In production, use a proper secret generation library or service
        return currentValue + "-rotated-" + System.currentTimeMillis();
    }

    /**
     * Share a secret with another user
     */
    @Transactional
    public SharedSecret shareSecret(String key, String sharedWith, String sharedBy, String permission, Authentication authentication) {
        log.debug("Sharing secret '{}' with user '{}'", key, sharedWith);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.SHARE)) {
            throw new AccessDeniedException("User does not have SHARE permission");
        }
        
        // Verify secret exists
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));
        
        // Verify user owns the secret (unless admin)
        if (!permissionEvaluator.isAdmin(authentication) && !secret.getCreatedBy().equals(sharedBy)) {
            throw new AccessDeniedException("Only the secret owner can share it");
        }
        
        // Check if already shared
        if (sharedSecretRepository.existsBySecretKeyAndSharedWith(key, sharedWith)) {
            throw new IllegalArgumentException("Secret is already shared with user: " + sharedWith);
        }
        
        // Default permission to READ if not specified
        String sharePermission = (permission != null && !permission.trim().isEmpty()) 
            ? permission.trim() 
            : "READ";
        
        SharedSecret sharedSecret = SharedSecret.builder()
            .secretKey(key)
            .sharedWith(sharedWith)
            .sharedBy(sharedBy)
            .permission(sharePermission)
            .build();
        
        SharedSecret saved = sharedSecretRepository.save(sharedSecret);
        
        // Async audit logging
        auditClient.logEvent("SHARE", key, sharedBy);
        
        log.info("Secret '{}' shared with user '{}' by '{}'", key, sharedWith, sharedBy);
        return saved;
    }

    /**
     * Unshare a secret (revoke access)
     */
    @Transactional
    public void unshareSecret(String key, String sharedWith, String unsharedBy, Authentication authentication) {
        log.debug("Unsharing secret '{}' from user '{}'", key, sharedWith);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.SHARE)) {
            throw new AccessDeniedException("User does not have SHARE permission");
        }
        
        // Verify secret exists
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));
        
        // Verify user owns the secret (unless admin)
        if (!permissionEvaluator.isAdmin(authentication) && !secret.getCreatedBy().equals(unsharedBy)) {
            throw new AccessDeniedException("Only the secret owner can unshare it");
        }
        
        if (!sharedSecretRepository.existsBySecretKeyAndSharedWith(key, sharedWith)) {
            throw new IllegalArgumentException("Secret is not shared with user: " + sharedWith);
        }
        
        sharedSecretRepository.deleteBySecretKeyAndSharedWith(key, sharedWith);
        
        // Async audit logging
        auditClient.logEvent("UNSHARE", key, unsharedBy);
        
        log.info("Secret '{}' unshared from user '{}' by '{}'", key, sharedWith, unsharedBy);
    }

    /**
     * Get all users a secret is shared with
     */
    @Transactional(readOnly = true)
    public java.util.List<SharedSecret> getSharedUsers(String key, String username, Authentication authentication) {
        log.debug("Getting shared users for secret '{}'", key);
        
        // Verify secret exists
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));
        
        // Verify user owns the secret (unless admin)
        if (!permissionEvaluator.isAdmin(authentication) && !secret.getCreatedBy().equals(username)) {
            throw new AccessDeniedException("Only the secret owner can view sharing information");
        }
        
        return sharedSecretRepository.findBySecretKey(key);
    }

    /**
     * Get all secrets shared with a user
     */
    @Transactional(readOnly = true)
    public java.util.List<SharedSecret> getSecretsSharedWithUser(String username, Authentication authentication) {
        log.debug("Getting secrets shared with user '{}'", username);
        
        // Users can only see secrets shared with themselves (unless admin)
        if (!permissionEvaluator.isAdmin(authentication) && !authentication.getName().equals(username)) {
            throw new AccessDeniedException("Users can only view secrets shared with themselves");
        }
        
        return sharedSecretRepository.findBySharedWith(username);
    }

    /**
     * Bulk create secrets
     */
    @Transactional
    public BulkSecretResponse bulkCreateSecrets(
            java.util.List<com.secrets.dto.SecretRequest> secretRequests,
            String createdBy,
            Authentication authentication) {
        
        log.debug("Bulk creating {} secrets", secretRequests.size());
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.WRITE)) {
            throw new AccessDeniedException("User does not have WRITE permission");
        }
        
        BulkSecretResponse.BulkSecretResponseBuilder responseBuilder = BulkSecretResponse.builder()
            .total(secretRequests.size())
            .successful(0)
            .failed(0)
            .created(new java.util.ArrayList<>())
            .errors(new java.util.ArrayList<>());
        
        for (com.secrets.dto.SecretRequest request : secretRequests) {
            try {
                Secret secret = createSecret(
                    request.getKey(),
                    request.getValue(),
                    createdBy,
                    authentication
                );
                
                String decryptedValue = decryptSecretValue(secret);
                responseBuilder.created.add(com.secrets.dto.SecretResponse.from(secret, decryptedValue));
                responseBuilder.successful++;
            } catch (Exception e) {
                log.warn("Failed to create secret '{}': {}", request.getKey(), e.getMessage());
                responseBuilder.errors.add(BulkSecretResponse.BulkError.builder()
                    .secretKey(request.getKey())
                    .error(e.getClass().getSimpleName())
                    .message(e.getMessage())
                    .build());
                responseBuilder.failed++;
            }
        }
        
        BulkSecretResponse response = responseBuilder.build();
        log.info("Bulk create completed: {} successful, {} failed out of {}", 
            response.getSuccessful(), response.getFailed(), response.getTotal());
        
        return response;
    }

    /**
     * Bulk update secrets
     */
    @Transactional
    public BulkSecretResponse bulkUpdateSecrets(
            java.util.List<com.secrets.dto.SecretRequest> secretRequests,
            String updatedBy,
            Authentication authentication) {
        
        log.debug("Bulk updating {} secrets", secretRequests.size());
        
        BulkSecretResponse.BulkSecretResponseBuilder responseBuilder = BulkSecretResponse.builder()
            .total(secretRequests.size())
            .successful(0)
            .failed(0)
            .created(new java.util.ArrayList<>())
            .errors(new java.util.ArrayList<>());
        
        for (com.secrets.dto.SecretRequest request : secretRequests) {
            try {
                Secret secret = updateSecret(
                    request.getKey(),
                    request.getValue(),
                    updatedBy,
                    authentication
                );
                
                String decryptedValue = decryptSecretValue(secret);
                responseBuilder.created.add(com.secrets.dto.SecretResponse.from(secret, decryptedValue));
                responseBuilder.successful++;
            } catch (Exception e) {
                log.warn("Failed to update secret '{}': {}", request.getKey(), e.getMessage());
                responseBuilder.errors.add(BulkSecretResponse.BulkError.builder()
                    .secretKey(request.getKey())
                    .error(e.getClass().getSimpleName())
                    .message(e.getMessage())
                    .build());
                responseBuilder.failed++;
            }
        }
        
        BulkSecretResponse response = responseBuilder.build();
        log.info("Bulk update completed: {} successful, {} failed out of {}", 
            response.getSuccessful(), response.getFailed(), response.getTotal());
        
        return response;
    }

    /**
     * Bulk delete secrets
     */
    @Transactional
    public BulkSecretResponse bulkDeleteSecrets(
            java.util.List<String> keys,
            String deletedBy,
            Authentication authentication) {
        
        log.debug("Bulk deleting {} secrets", keys.size());
        
        BulkSecretResponse.BulkSecretResponseBuilder responseBuilder = BulkSecretResponse.builder()
            .total(keys.size())
            .successful(0)
            .failed(0)
            .created(new java.util.ArrayList<>())
            .errors(new java.util.ArrayList<>());
        
        for (String key : keys) {
            try {
                deleteSecret(key, deletedBy, authentication);
                responseBuilder.successful++;
            } catch (Exception e) {
                log.warn("Failed to delete secret '{}': {}", key, e.getMessage());
                responseBuilder.errors.add(BulkSecretResponse.BulkError.builder()
                    .secretKey(key)
                    .error(e.getClass().getSimpleName())
                    .message(e.getMessage())
                    .build());
                responseBuilder.failed++;
            }
        }
        
        BulkSecretResponse response = responseBuilder.build();
        log.info("Bulk delete completed: {} successful, {} failed out of {}", 
            response.getSuccessful(), response.getFailed(), response.getTotal());
        
        return response;
    }

    /**
     * Check if a secret is expired before allowing access
     */
    private void checkExpiration(Secret secret) {
        if (secret.isExpired()) {
            throw new IllegalStateException(
                String.format("Secret '%s' has expired (expired at: %s)", 
                    secret.getSecretKey(), secret.getExpiresAt()));
        }
    }
}

